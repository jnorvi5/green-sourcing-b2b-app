-- RLS Policies for Supplier Workflow

-- Enable RLS on tables if not already enabled
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 1. Suppliers Table Policies
-- Suppliers can read their own profile
CREATE POLICY "Suppliers can view own profile"
ON suppliers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Suppliers can update their own profile
CREATE POLICY "Suppliers can update own profile"
ON suppliers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 2. RFQs Table Policies
-- Suppliers can view RFQs where they are the assigned supplier
-- AND the RFQ is not in 'draft' or 'cancelled' status (optional refinement)
CREATE POLICY "Suppliers can view assigned rfqs"
ON rfqs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = rfqs.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

-- 3. RFQ Responses Table Policies
-- Suppliers can view their own responses
CREATE POLICY "Suppliers can view own responses"
ON rfq_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = rfq_responses.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

-- Suppliers can insert responses for RFQs assigned to them
CREATE POLICY "Suppliers can create responses"
ON rfq_responses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = rfq_responses.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

-- Suppliers can update their own responses (e.g. before acceptance)
CREATE POLICY "Suppliers can update own responses"
ON rfq_responses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = rfq_responses.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

-- 4. Products Table Policies
-- Suppliers can view their own products
CREATE POLICY "Suppliers can view own products"
ON products
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = products.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

-- Suppliers can insert their own products
CREATE POLICY "Suppliers can create products"
ON products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = products.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

-- Suppliers can update their own products
CREATE POLICY "Suppliers can update own products"
ON products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = products.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);

-- Suppliers can delete their own products
CREATE POLICY "Suppliers can delete own products"
ON products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM suppliers
    WHERE suppliers.id = products.supplier_id
    AND suppliers.user_id = auth.uid()
  )
);
