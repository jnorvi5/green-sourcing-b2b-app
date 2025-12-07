-- Add helpful indexes for product filters and RFQ lookups
-- Carbon footprint numeric cast index for range filters
CREATE INDEX IF NOT EXISTS idx_products_carbon_footprint_num ON public.products (
    (
        (sustainability_data->>'carbon_footprint')::numeric
    )
);
-- RFQ status lookup
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs (status);