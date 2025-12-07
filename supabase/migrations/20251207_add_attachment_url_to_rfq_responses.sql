-- Migration: Add attachment_url to rfq_responses
-- Created: 2025-12-07
-- 
-- Description:
-- Adds attachment_url column to rfq_responses table to store
-- PDF quote attachment URLs from Supabase Storage.

-- ============================================
-- UP MIGRATION
-- ============================================

-- Add attachment_url column to rfq_responses
ALTER TABLE rfq_responses
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Add index for performance (optional, for filtering quotes with attachments)
CREATE INDEX IF NOT EXISTS idx_rfq_responses_attachment_url 
ON rfq_responses(attachment_url) 
WHERE attachment_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN rfq_responses.attachment_url IS 'URL to PDF quote attachment in Supabase Storage (signed URL or path)';

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this query after migration to verify:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'rfq_responses' AND column_name = 'attachment_url';

-- ============================================
-- DOWN MIGRATION (Rollback)
-- ============================================
-- Uncomment these lines to rollback:
-- DROP INDEX IF EXISTS idx_rfq_responses_attachment_url;
-- ALTER TABLE rfq_responses DROP COLUMN IF EXISTS attachment_url;
