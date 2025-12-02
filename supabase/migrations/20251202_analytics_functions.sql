-- Analytics Engine Stored Procedures
-- These functions handle upserts and aggregation for analytics tracking
-- Created: 2025-12-02

-- ============================================
-- SEARCH ANALYTICS FUNCTIONS
-- ============================================

-- Upsert search keyword aggregation
CREATE OR REPLACE FUNCTION upsert_search_keyword(
  p_keyword VARCHAR(255),
  p_material_type VARCHAR(100)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO Search_Keywords_Aggregated (keyword, search_count, material_type_category, trend_direction, updated_at)
  VALUES (p_keyword, 1, p_material_type, 'stable', CURRENT_TIMESTAMP)
  ON CONFLICT (keyword) DO UPDATE SET
    search_count = Search_Keywords_Aggregated.search_count + 1,
    material_type_category = COALESCE(p_material_type, Search_Keywords_Aggregated.material_type_category),
    last_searched = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FILTER ANALYTICS FUNCTIONS
-- ============================================

-- Upsert carbon threshold preference
CREATE OR REPLACE FUNCTION upsert_carbon_threshold(
  p_threshold_range VARCHAR(100),
  p_geographic_region VARCHAR(100)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO Carbon_Threshold_Preferences (threshold_range, usage_count, geographic_region, updated_at)
  VALUES (p_threshold_range, 1, p_geographic_region, CURRENT_TIMESTAMP)
  ON CONFLICT (threshold_range) DO UPDATE SET
    usage_count = Carbon_Threshold_Preferences.usage_count + 1,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Upsert certification preference
CREATE OR REPLACE FUNCTION upsert_certification_preference(
  p_certification_name VARCHAR(255),
  p_geographic_region VARCHAR(100)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO Certification_Preferences (certification_name, filter_count, geographic_region, updated_at)
  VALUES (p_certification_name, 1, p_geographic_region, CURRENT_TIMESTAMP)
  ON CONFLICT (certification_name, geographic_region, material_type_category) 
  WHERE material_type_category IS NULL
  DO UPDATE SET
    filter_count = Certification_Preferences.filter_count + 1,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Upsert price preference
CREATE OR REPLACE FUNCTION upsert_price_preference(
  p_min_price DECIMAL(10, 2),
  p_max_price DECIMAL(10, 2),
  p_geographic_region VARCHAR(100)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO Price_Range_Preferences (min_price, max_price, usage_count, geographic_region, updated_at)
  VALUES (p_min_price, p_max_price, 1, p_geographic_region, CURRENT_TIMESTAMP)
  ON CONFLICT (min_price, max_price, material_type_category, geographic_region) 
  WHERE material_type_category IS NULL
  DO UPDATE SET
    usage_count = Price_Range_Preferences.usage_count + 1,
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RFQ ANALYTICS FUNCTIONS
-- ============================================

-- Update RFQ analytics
CREATE OR REPLACE FUNCTION update_rfq_analytics(
  p_material_type VARCHAR(100),
  p_geographic_region VARCHAR(100),
  p_time_period DATE,
  p_status VARCHAR(50),
  p_quoted_price DECIMAL(10, 2),
  p_response_time INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_existing_record RECORD;
  v_new_count INTEGER;
  v_new_avg_order DECIMAL(10, 2);
  v_new_avg_time INTEGER;
  v_conversion_increment DECIMAL(5, 4);
BEGIN
  -- Check if record exists
  SELECT * INTO v_existing_record
  FROM RFQ_Analytics
  WHERE material_type_category = p_material_type
    AND geographic_region = p_geographic_region
    AND time_period = p_time_period;

  IF v_existing_record IS NULL THEN
    -- Insert new record
    INSERT INTO RFQ_Analytics (
      material_type_category, rfq_count, conversion_rate, 
      average_time_to_close, average_order_value, geographic_region, time_period
    ) VALUES (
      p_material_type, 1, 
      CASE WHEN p_status = 'accepted' THEN 1.0 ELSE 0.0 END,
      COALESCE(p_response_time, 0),
      COALESCE(p_quoted_price, 0),
      p_geographic_region, p_time_period
    );
  ELSE
    -- Update existing record
    v_new_count := v_existing_record.rfq_count + 1;
    v_conversion_increment := CASE WHEN p_status = 'accepted' THEN 1.0 ELSE 0.0 END;
    
    -- Calculate new averages
    v_new_avg_order := (v_existing_record.average_order_value * v_existing_record.rfq_count + COALESCE(p_quoted_price, 0)) / v_new_count;
    v_new_avg_time := (v_existing_record.average_time_to_close * v_existing_record.rfq_count + COALESCE(p_response_time, 0)) / v_new_count;
    
    UPDATE RFQ_Analytics SET
      rfq_count = v_new_count,
      conversion_rate = (v_existing_record.conversion_rate * v_existing_record.rfq_count + v_conversion_increment) / v_new_count,
      average_time_to_close = v_new_avg_time,
      average_order_value = v_new_avg_order,
      updated_at = CURRENT_TIMESTAMP
    WHERE material_type_category = p_material_type
      AND geographic_region = p_geographic_region
      AND time_period = p_time_period;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update certification RFQ performance
CREATE OR REPLACE FUNCTION update_certification_rfq_performance(
  p_certification_name VARCHAR(255),
  p_time_period DATE,
  p_status VARCHAR(50),
  p_quoted_price DECIMAL(10, 2),
  p_response_time INTEGER
)
RETURNS VOID AS $$
DECLARE
  v_existing_record RECORD;
  v_new_count INTEGER;
  v_win_increment INTEGER;
BEGIN
  -- Check if record exists
  SELECT * INTO v_existing_record
  FROM Certification_RFQ_Performance
  WHERE certification_name = p_certification_name
    AND time_period = p_time_period;

  v_win_increment := CASE WHEN p_status = 'accepted' THEN 1 ELSE 0 END;

  IF v_existing_record IS NULL THEN
    -- Insert new record
    INSERT INTO Certification_RFQ_Performance (
      certification_name, rfq_count, win_rate, average_time_to_close, 
      average_quote_value, time_period
    ) VALUES (
      p_certification_name, 1, 
      CASE WHEN p_status = 'accepted' THEN 1.0 ELSE 0.0 END,
      COALESCE(p_response_time, 0),
      COALESCE(p_quoted_price, 0),
      p_time_period
    );
  ELSE
    -- Update existing record
    v_new_count := v_existing_record.rfq_count + 1;
    
    UPDATE Certification_RFQ_Performance SET
      rfq_count = v_new_count,
      win_rate = (v_existing_record.win_rate * v_existing_record.rfq_count + v_win_increment) / v_new_count,
      average_time_to_close = (v_existing_record.average_time_to_close * v_existing_record.rfq_count + COALESCE(p_response_time, 0)) / v_new_count,
      average_quote_value = (v_existing_record.average_quote_value * v_existing_record.rfq_count + COALESCE(p_quoted_price, 0)) / v_new_count,
      updated_at = CURRENT_TIMESTAMP
    WHERE certification_name = p_certification_name
      AND time_period = p_time_period;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GEOGRAPHIC ANALYTICS FUNCTIONS
-- ============================================

-- Update geographic demand
CREATE OR REPLACE FUNCTION update_geographic_demand(
  p_region VARCHAR(100),
  p_material_type VARCHAR(100),
  p_search_increment INTEGER DEFAULT 0,
  p_rfq_increment INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_existing_record RECORD;
  v_supplier_count INTEGER;
BEGIN
  -- Get current supplier count for region/material (simplified)
  SELECT COUNT(*) INTO v_supplier_count
  FROM Suppliers s
  JOIN Companies c ON s.CompanyID = c.CompanyID
  WHERE c.Address ILIKE '%' || p_region || '%';
  
  IF v_supplier_count IS NULL THEN
    v_supplier_count := 0;
  END IF;

  -- Check if record exists
  SELECT * INTO v_existing_record
  FROM Geographic_Demand
  WHERE region = p_region
    AND material_type_category = p_material_type
    AND time_period = v_today;

  IF v_existing_record IS NULL THEN
    -- Insert new record
    INSERT INTO Geographic_Demand (
      region, material_type_category, search_volume, rfq_volume, 
      supplier_count, demand_supply_gap, time_period
    ) VALUES (
      p_region, p_material_type, p_search_increment, p_rfq_increment,
      v_supplier_count,
      CASE WHEN v_supplier_count > 0 
        THEN (p_search_increment + p_rfq_increment * 10.0) / v_supplier_count 
        ELSE 0 
      END,
      v_today
    );
  ELSE
    -- Update existing record
    UPDATE Geographic_Demand SET
      search_volume = v_existing_record.search_volume + p_search_increment,
      rfq_volume = v_existing_record.rfq_volume + p_rfq_increment,
      supplier_count = v_supplier_count,
      demand_supply_gap = CASE WHEN v_supplier_count > 0 
        THEN ((v_existing_record.search_volume + p_search_increment) + (v_existing_record.rfq_volume + p_rfq_increment) * 10.0) / v_supplier_count 
        ELSE 0 
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE region = p_region
      AND material_type_category = p_material_type
      AND time_period = v_today;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- KEYWORD TREND ANALYSIS
-- ============================================

-- Calculate keyword trends (run weekly)
CREATE OR REPLACE FUNCTION calculate_keyword_trends()
RETURNS VOID AS $$
DECLARE
  v_keyword_record RECORD;
  v_current_week_count INTEGER;
  v_prev_week_count INTEGER;
  v_trend VARCHAR(20);
BEGIN
  FOR v_keyword_record IN 
    SELECT keyword FROM Search_Keywords_Aggregated
  LOOP
    -- Get current week search count
    SELECT COUNT(*) INTO v_current_week_count
    FROM Search_Events
    WHERE search_query ILIKE '%' || v_keyword_record.keyword || '%'
      AND search_timestamp >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Get previous week search count
    SELECT COUNT(*) INTO v_prev_week_count
    FROM Search_Events
    WHERE search_query ILIKE '%' || v_keyword_record.keyword || '%'
      AND search_timestamp >= CURRENT_DATE - INTERVAL '14 days'
      AND search_timestamp < CURRENT_DATE - INTERVAL '7 days';
    
    -- Determine trend
    IF v_prev_week_count = 0 THEN
      v_trend := 'rising';
    ELSIF v_current_week_count > v_prev_week_count * 1.2 THEN
      v_trend := 'rising';
    ELSIF v_current_week_count < v_prev_week_count * 0.8 THEN
      v_trend := 'declining';
    ELSE
      v_trend := 'stable';
    END IF;
    
    -- Update trend
    UPDATE Search_Keywords_Aggregated
    SET trend_direction = v_trend,
        updated_at = CURRENT_TIMESTAMP
    WHERE keyword = v_keyword_record.keyword;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MATERIALIZED VIEW REFRESH
-- ============================================

-- Refresh all analytics materialized views (run daily)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY Top_Searched_Keywords;
  REFRESH MATERIALIZED VIEW CONCURRENTLY Certification_Demand_Summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY Geographic_Market_Gaps;
  REFRESH MATERIALIZED VIEW CONCURRENTLY Certification_Performance_Summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATA LICENSING FUNCTIONS
-- ============================================

-- Generate API key for data license customer
CREATE OR REPLACE FUNCTION generate_data_license_api_key()
RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN 'gc_data_' || encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Validate API key and check rate limits
CREATE OR REPLACE FUNCTION validate_data_license_api_key(p_api_key VARCHAR(255))
RETURNS TABLE (
  customer_id BIGINT,
  license_tier VARCHAR(50),
  is_valid BOOLEAN,
  allowed_report_types TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dlc.customer_id,
    dlc.license_tier,
    (dlc.status = 'Active' AND (dlc.license_end_date IS NULL OR dlc.license_end_date > CURRENT_DATE)) AS is_valid,
    dlc.allowed_report_types
  FROM Data_License_Customers dlc
  WHERE dlc.api_key = p_api_key;
END;
$$ LANGUAGE plpgsql;

-- Comment on stored procedures
COMMENT ON FUNCTION upsert_search_keyword IS 'Increments search count for a keyword or inserts new keyword';
COMMENT ON FUNCTION update_rfq_analytics IS 'Updates RFQ analytics aggregation with new RFQ event';
COMMENT ON FUNCTION calculate_keyword_trends IS 'Calculates rising/declining trends for keywords. Run weekly.';
COMMENT ON FUNCTION refresh_analytics_views IS 'Refreshes all analytics materialized views. Run daily.';
