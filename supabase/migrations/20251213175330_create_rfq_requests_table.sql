-- Create rfq_requests table
CREATE TABLE IF NOT EXISTS public.rfq_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL REFERENCES public.users(id),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity INTEGER NOT NULL,
    delivery_date DATE,
    project_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status rfq_status DEFAULT 'pending'
);

-- Enable RLS
ALTER TABLE public.rfq_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Buyers can view their own RFQs
CREATE POLICY "Buyers can view their own RFQs"
ON public.rfq_requests
FOR SELECT
USING (auth.uid() = buyer_id);

-- Suppliers can view incoming RFQs
CREATE POLICY "Suppliers can view incoming RFQs"
ON public.rfq_requests
FOR SELECT
USING (auth.uid() = supplier_id);

-- Buyers can create RFQs
CREATE POLICY "Buyers can create RFQs"
ON public.rfq_requests
FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Suppliers can update status (e.g., mark as responded)
CREATE POLICY "Suppliers can update status"
ON public.rfq_requests
FOR UPDATE
USING (auth.uid() = supplier_id)
WITH CHECK (auth.uid() = supplier_id);
