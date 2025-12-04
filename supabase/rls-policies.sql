-- GreenChainz Row Level Security (RLS) Policies
-- Generated: 2025-12-02
-- Purpose: Enforce data isolation for Architects, Suppliers, and Admins

-- ============================================
-- Enable RLS on All Tables
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.epd_data ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.autodesk_connections ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.autodesk_exports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bim_analyses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. Profiles
-- ============================================
-- Users can view/edit their own profile. Admins can view/edit all.
CREATE POLICY "Users can view own profile" ON public.profiles FOR
SELECT USING (
        auth.uid () = id
        OR is_admin ()
    );

CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (
    auth.uid () = id
    OR is_admin ()
);

-- ============================================
-- 2. Suppliers
-- ============================================
-- Public read access for supplier profiles (needed for marketplace)
CREATE POLICY "Supplier profiles are public" ON public.suppliers FOR
SELECT USING (true);

-- Suppliers can update their own profile
CREATE POLICY "Suppliers can update own profile" ON public.suppliers FOR
UPDATE USING (
    user_id = auth.uid ()
    OR is_admin ()
);

-- Only Admins can insert/delete suppliers (usually handled via onboarding flow or admin panel)
CREATE POLICY "Admins can manage suppliers" ON public.suppliers FOR ALL USING (is_admin ());

-- ============================================
-- 3. Products
-- ============================================
-- Public read access for products
CREATE POLICY "Products are public" ON public.products FOR
SELECT USING (true);

-- Suppliers can insert/update/delete their own products
CREATE POLICY "Suppliers manage own products" ON public.products FOR ALL USING (
    supplier_id = get_my_supplier_id ()
    OR is_admin ()
);

-- ============================================
-- 4. EPD Data
-- ============================================
-- Public read access
CREATE POLICY "EPD data is public" ON public.epd_data FOR
SELECT USING (true);

-- Suppliers manage their own product EPDs
CREATE POLICY "Suppliers manage own EPDs" ON public.epd_data FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.products
        WHERE
            products.id = epd_data.product_id
            AND (
                products.supplier_id = get_my_supplier_id ()
                OR is_admin ()
            )
    )
);

-- ============================================
-- 5. RFQs (Request for Quotes)
-- ============================================
-- Architects (Creators) can view their own RFQs
CREATE POLICY "Architects view own RFQs" ON public.rfqs FOR
SELECT USING (user_id = auth.uid ());

-- Suppliers can view RFQs sent to them
CREATE POLICY "Suppliers view matched RFQs" ON public.rfqs FOR
SELECT USING (
        supplier_id = get_my_supplier_id ()
    );

-- Admins can view all
CREATE POLICY "Admins view all RFQs" ON public.rfqs FOR
SELECT USING (is_admin ());

-- Architects can create RFQs
CREATE POLICY "Architects create RFQs" ON public.rfqs FOR
INSERT
WITH
    CHECK (user_id = auth.uid ());

-- Architects can update their own RFQs (e.g., close them)
CREATE POLICY "Architects update own RFQs" ON public.rfqs FOR
UPDATE USING (user_id = auth.uid ());

-- Suppliers can update RFQs sent to them (e.g., to answer)
CREATE POLICY "Suppliers update matched RFQs" ON public.rfqs FOR
UPDATE USING (
    supplier_id = get_my_supplier_id ()
);

-- ============================================
-- 6. Autodesk Integration
-- ============================================
-- Users manage their own connections
CREATE POLICY "Users manage own Autodesk connection" ON public.autodesk_connections FOR ALL USING (user_id = auth.uid ());

-- Users see their own exports
CREATE POLICY "Users see own exports" ON public.autodesk_exports FOR
SELECT USING (user_id = auth.uid ());

-- Users see their own analyses
CREATE POLICY "Users see own analyses" ON public.bim_analyses FOR ALL USING (user_id = auth.uid ());

-- ============================================
-- 7. Subscriptions & Payments
-- ============================================
-- Suppliers see their own subscription
CREATE POLICY "Suppliers see own subscription" ON public.subscriptions FOR
SELECT USING (
        supplier_id = get_my_supplier_id ()
    );

-- Suppliers see their own payments
CREATE POLICY "Suppliers see own payments" ON public.payments FOR
SELECT USING (
        supplier_id = get_my_supplier_id ()
    );

-- System/Admin management (usually service_role key bypasses RLS, but adding admin policy just in case)
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions FOR ALL USING (is_admin ());

CREATE POLICY "Admins manage payments" ON public.payments FOR ALL USING (is_admin ());