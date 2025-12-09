-- Add certification verification fields to suppliers table
-- This enables the admin "White Glove" certification verification workflow

ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS cert_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS cert_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cert_verification_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cert_type TEXT,
ADD COLUMN IF NOT EXISTS cert_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS cert_uploaded_at TIMESTAMPTZ;

-- Add index for quick filtering of pending certifications
CREATE INDEX IF NOT EXISTS idx_suppliers_pending_certs 
ON suppliers (cert_verified, cert_uploaded_at) 
WHERE cert_pdf_url IS NOT NULL;

-- Add index for verification date queries (for stats)
CREATE INDEX IF NOT EXISTS idx_suppliers_verification_date 
ON suppliers (cert_verification_date) 
WHERE cert_verification_date IS NOT NULL;

-- Update RLS policies to allow admins to manage certifications
-- Admins can view and update certification fields
CREATE POLICY "Admins can manage certifications"
ON suppliers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Add comments for documentation
COMMENT ON COLUMN suppliers.cert_pdf_url IS 'URL to uploaded certification PDF document';
COMMENT ON COLUMN suppliers.cert_verified IS 'Whether certification has been verified by admin';
COMMENT ON COLUMN suppliers.cert_verification_date IS 'Date when certification was verified or rejected';
COMMENT ON COLUMN suppliers.cert_type IS 'Type of certification (FSC, B Corp, ISO 14001, etc.)';
COMMENT ON COLUMN suppliers.cert_rejection_reason IS 'Admin notes for rejected certifications';
COMMENT ON COLUMN suppliers.cert_uploaded_at IS 'Date when certification was uploaded by supplier';
