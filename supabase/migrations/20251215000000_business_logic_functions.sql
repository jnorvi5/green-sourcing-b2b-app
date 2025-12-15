-- Migration: Business Logic Functions
-- Date: 2025-12-15

-- 1. Schema Enhancements

ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS response_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_response_time_minutes NUMERIC DEFAULT 0;

ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- Table for daily limits tracking if not exists
CREATE TABLE IF NOT EXISTS public.user_daily_usage (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE DEFAULT CURRENT_DATE,
    rfq_count INTEGER DEFAULT 0,
    product_upload_count INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, usage_date)
);

-- Ensure dependency tables exist (as per Code Review)
-- Usually these come from previous migrations, but we include minimal definitions for robustness if run standalone.

-- rfq_matches (from 20251207)
CREATE TABLE IF NOT EXISTS public.rfq_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reason TEXT,
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  notification_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_rfq_supplier_match UNIQUE (rfq_id, supplier_id)
);

-- epd_data (This was referenced as 'epd_data' in schema.sql but 'epd_database' in 20251209 migration)
-- My code uses 'epd_data' which matches schema.sql.
-- schema.sql definition:
CREATE TABLE IF NOT EXISTS public.epd_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
    gwp NUMERIC,
    metadata JSONB,
    validity_start_date DATE,
    validity_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Core Business Logic Functions

-- Function 1: Calculate User Quality Score
CREATE OR REPLACE FUNCTION calculate_user_quality_score(supplier_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_score INTEGER := 50; -- Base score
    v_supplier public.suppliers%ROWTYPE;
    v_products_count INTEGER;
    v_verified_products_count INTEGER;
BEGIN
    SELECT * INTO v_supplier FROM public.suppliers WHERE id = supplier_uuid;

    IF v_supplier IS NULL THEN
        RETURN 0;
    END IF;

    -- Bonus for verification
    IF v_supplier.verification_status = 'verified' THEN
        v_score := v_score + 30;
    END IF;

    -- Bonus for profile completeness
    IF v_supplier.logo_url IS NOT NULL THEN
        v_score := v_score + 10;
    END IF;
    IF v_supplier.description IS NOT NULL AND length(v_supplier.description) > 50 THEN
        v_score := v_score + 10;
    END IF;

    -- Product metrics
    SELECT COUNT(*) INTO v_products_count FROM public.products WHERE supplier_id = supplier_uuid;
    SELECT COUNT(*) INTO v_verified_products_count FROM public.products WHERE supplier_id = supplier_uuid AND verified = true;

    IF v_products_count > 0 THEN
        v_score := v_score + 10;
        -- Bonus for verified products ratio
        IF v_products_count > 0 THEN
             v_score := v_score + CAST((v_verified_products_count::float / v_products_count::float) * 20 AS INTEGER);
        END IF;
    END IF;

    -- Response rate impact (0-20 points)
    v_score := v_score + CAST((COALESCE(v_supplier.response_rate, 0) / 100) * 20 AS INTEGER);

    -- Cap at 100
    IF v_score > 100 THEN v_score := 100; END IF;

    -- Update the score in table
    UPDATE public.suppliers SET quality_score = v_score WHERE id = supplier_uuid;

    RETURN v_score;
END;
$$;

-- Function 2: Get User Daily Limit
CREATE OR REPLACE FUNCTION get_user_daily_limit(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role user_role;
    v_supplier_tier TEXT;
    v_rfq_limit INTEGER;
    v_product_limit INTEGER;
BEGIN
    -- Get role
    SELECT role INTO v_role FROM public.profiles WHERE id = user_uuid;

    IF v_role = 'supplier' THEN
        SELECT tier INTO v_supplier_tier FROM public.suppliers WHERE user_id = user_uuid;
        -- Define limits based on tier (could fetch from a config table)
        IF v_supplier_tier = 'verified' THEN
            v_rfq_limit := 1000; -- High limit
            v_product_limit := 100;
        ELSIF v_supplier_tier = 'standard' THEN
             v_rfq_limit := 50;
             v_product_limit := 20;
        ELSE -- Free
             v_rfq_limit := 5;
             v_product_limit := 1;
        END IF;
    ELSE
        -- Buyers
        v_rfq_limit := 10; -- Example limit for buyers
        v_product_limit := 0;
    END IF;

    RETURN jsonb_build_object(
        'rfq_limit', v_rfq_limit,
        'product_limit', v_product_limit,
        'tier', COALESCE(v_supplier_tier, 'buyer')
    );
END;
$$;

-- Function 3: Route RFQ to Suppliers
-- Logic: If supplier_id is null, find matching suppliers and insert into rfq_matches
CREATE OR REPLACE FUNCTION route_rfq_to_suppliers(p_rfq_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rfq public.rfqs%ROWTYPE;
    v_product public.products%ROWTYPE;
    v_match_count INTEGER := 0;
    v_supplier RECORD;
BEGIN
    SELECT * INTO v_rfq FROM public.rfqs WHERE id = p_rfq_id;

    -- If already assigned to a supplier, do nothing (or notify them)
    IF v_rfq.supplier_id IS NOT NULL THEN
        -- Verify supplier exists
        PERFORM 1 FROM public.suppliers WHERE id = v_rfq.supplier_id;
        RETURN 1;
    END IF;

    -- If no product attached, hard to route (unless we use text matching, skipping for MVP)
    IF v_rfq.product_id IS NOT NULL THEN
        SELECT * INTO v_product FROM public.products WHERE id = v_rfq.product_id;

        -- Find suppliers with same material_type
        FOR v_supplier IN
            SELECT s.id, s.quality_score
            FROM public.suppliers s
            JOIN public.products p ON p.supplier_id = s.id
            WHERE p.material_type = v_product.material_type
            AND s.id != COALESCE(v_rfq.supplier_id, '00000000-0000-0000-0000-000000000000') -- Exclude if somehow set
            GROUP BY s.id, s.quality_score
        LOOP
            -- Insert match
            INSERT INTO public.rfq_matches (rfq_id, supplier_id, match_score, match_reason)
            VALUES (p_rfq_id, v_supplier.id, v_supplier.quality_score, 'Material match')
            ON CONFLICT DO NOTHING;

            v_match_count := v_match_count + 1;
        END LOOP;
    END IF;

    RETURN v_match_count;
END;
$$;

-- Function 4: Update Supplier Metrics
CREATE OR REPLACE FUNCTION update_supplier_metrics(supplier_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_rfqs INTEGER;
    v_answered_rfqs INTEGER;
    v_avg_minutes NUMERIC;
BEGIN
    -- Calculate Response Rate
    SELECT COUNT(*) INTO v_total_rfqs FROM public.rfqs WHERE supplier_id = supplier_uuid;
    SELECT COUNT(*) INTO v_answered_rfqs FROM public.rfqs WHERE supplier_id = supplier_uuid AND status IN ('answered', 'closed');

    IF v_total_rfqs > 0 THEN
        UPDATE public.suppliers
        SET response_rate = ROUND((v_answered_rfqs::numeric / v_total_rfqs::numeric) * 100, 2)
        WHERE id = supplier_uuid;
    ELSE
        UPDATE public.suppliers SET response_rate = 0 WHERE id = supplier_uuid;
    END IF;

    -- Calculate Avg Response Time
    SELECT AVG(EXTRACT(EPOCH FROM (responded_at - created_at))/60)
    INTO v_avg_minutes
    FROM public.rfqs
    WHERE supplier_id = supplier_uuid
    AND responded_at IS NOT NULL;

    UPDATE public.suppliers
    SET avg_response_time_minutes = COALESCE(ROUND(v_avg_minutes, 2), 0)
    WHERE id = supplier_uuid;
END;
$$;

-- Function 5: Check RFQ Deposit Guarantee (SLA)
CREATE OR REPLACE FUNCTION check_rfq_deposit_guarantee(p_rfq_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rfq public.rfqs%ROWTYPE;
    v_sla_hours INTEGER := 24;
    v_hours_elapsed NUMERIC;
BEGIN
    SELECT * INTO v_rfq FROM public.rfqs WHERE id = p_rfq_id;

    IF v_rfq.status = 'answered' OR v_rfq.status = 'closed' THEN
        RETURN 'fulfilled';
    END IF;

    v_hours_elapsed := EXTRACT(EPOCH FROM (NOW() - v_rfq.created_at))/3600;

    IF v_hours_elapsed > v_sla_hours THEN
        -- Logic to penalize or claim guarantee could go here
        RETURN 'breached';
    END IF;

    RETURN 'pending';
END;
$$;

-- Function 6: Calculate Response Time (Helper)
CREATE OR REPLACE FUNCTION calculate_response_time(p_rfq_id UUID)
RETURNS INTERVAL
LANGUAGE plpgsql
AS $$
DECLARE
    v_rfq public.rfqs%ROWTYPE;
BEGIN
    SELECT * INTO v_rfq FROM public.rfqs WHERE id = p_rfq_id;
    IF v_rfq.responded_at IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN v_rfq.responded_at - v_rfq.created_at;
END;
$$;

-- Function 7: Check Daily RFQ Limit
CREATE OR REPLACE FUNCTION check_daily_rfq_limit(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_limit_info JSONB;
    v_current_usage INTEGER;
    v_max_limit INTEGER;
BEGIN
    v_limit_info := get_user_daily_limit(user_uuid);
    v_max_limit := (v_limit_info->>'rfq_limit')::INTEGER;

    SELECT rfq_count INTO v_current_usage
    FROM public.user_daily_usage
    WHERE user_id = user_uuid AND usage_date = CURRENT_DATE;

    IF COALESCE(v_current_usage, 0) >= v_max_limit THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- Function 8: Increment Daily RFQ Count
CREATE OR REPLACE FUNCTION increment_daily_rfq_count(user_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_daily_usage (user_id, usage_date, rfq_count)
    VALUES (user_uuid, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET rfq_count = user_daily_usage.rfq_count + 1;
END;
$$;

-- Function 9: Get Supplier Tier Config
CREATE OR REPLACE FUNCTION get_supplier_tier_config(p_tier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_tier = 'verified' THEN
        RETURN '{"can_respond_instantly": true, "max_products": 9999, "support_level": "priority"}'::jsonb;
    ELSIF p_tier = 'standard' THEN
        RETURN '{"can_respond_instantly": true, "max_products": 10, "support_level": "standard"}'::jsonb;
    ELSE
        RETURN '{"can_respond_instantly": false, "max_products": 1, "support_level": "basic"}'::jsonb;
    END IF;
END;
$$;

-- Function 10: Verify Supplier Eligibility (e.g. for premium features)
CREATE OR REPLACE FUNCTION verify_supplier_eligibility(supplier_uuid UUID, feature_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT tier INTO v_tier FROM public.suppliers WHERE id = supplier_uuid;

    IF feature_key = 'bulk_upload' AND v_tier = 'verified' THEN
        RETURN TRUE;
    END IF;

    IF feature_key = 'analytics' AND v_tier IN ('standard', 'verified') THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Function 11: Auto Approve Product
CREATE OR REPLACE FUNCTION auto_approve_product(product_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_supplier_id UUID;
    v_supplier_tier TEXT;
    v_quality_score INTEGER;
BEGIN
    SELECT supplier_id INTO v_supplier_id FROM public.products WHERE id = product_uuid;
    SELECT tier, quality_score INTO v_supplier_tier, v_quality_score FROM public.suppliers WHERE id = v_supplier_id;

    -- Auto approve if Verified tier and High Quality Score
    IF v_supplier_tier = 'verified' AND v_quality_score > 80 THEN
        UPDATE public.products SET verified = TRUE WHERE id = product_uuid;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;

-- Function 12: Get Recommended Suppliers
CREATE OR REPLACE FUNCTION get_recommended_suppliers(p_material_type TEXT)
RETURNS TABLE (supplier_id UUID, supplier_name TEXT, score INTEGER)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.name, s.quality_score
    FROM public.suppliers s
    JOIN public.products p ON p.supplier_id = s.id
    WHERE p.material_type = p_material_type
    ORDER BY s.quality_score DESC
    LIMIT 5;
END;
$$;

-- Function 13: Archive Stale RFQs
CREATE OR REPLACE FUNCTION archive_stale_rfqs(days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH archived AS (
        UPDATE public.rfqs
        SET status = 'closed'
        WHERE status = 'pending' AND created_at < NOW() - (days_old || ' days')::INTERVAL
        RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM archived;
    return v_count;
END;
$$;

-- Function 14: Calculate Carbon Saving (Mock)
CREATE OR REPLACE FUNCTION calculate_carbon_saving(product_uuid UUID, baseline_gwp NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    v_gwp NUMERIC;
BEGIN
    -- Try to find GWP from epd_data
    SELECT gwp INTO v_gwp FROM public.epd_data WHERE product_id = product_uuid LIMIT 1;

    IF v_gwp IS NULL THEN
        RETURN 0;
    END IF;

    RETURN GREATEST(0, baseline_gwp - v_gwp);
END;
$$;

-- Function 15: Validate RFQ Content (Anti-spam)
CREATE OR REPLACE FUNCTION validate_rfq_content(p_message TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    IF length(p_message) < 10 THEN
        RETURN FALSE;
    END IF;

    IF p_message ILIKE '%crypto%' OR p_message ILIKE '%investment%' THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$;

-- Function 16: Notify Supplier of RFQ (Stub)
CREATE OR REPLACE FUNCTION notify_supplier_of_rfq(p_rfq_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- In a real scenario, this might insert into a notifications table
    -- or trigger an Edge Function via pg_net (if enabled)
    -- For now, it's a placeholder hook
    PERFORM 1;
END;
$$;
