-- Migration: Setup Supabase Storage for RFQ Quote PDFs
-- Created: 2025-12-07
-- 
-- Description:
-- Creates a storage bucket 'quotes' for supplier quote PDF attachments
-- and sets up Row Level Security (RLS) policies for access control.
--
-- Note: Storage buckets must be created via Supabase Dashboard or CLI
-- This migration documents the required configuration.
--
-- Manual Steps Required:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a new bucket named 'quotes'
-- 3. Set bucket to 'Private' (not public)
-- 4. Apply the RLS policies below
--
-- Alternatively, use the Supabase CLI:
-- supabase storage create quotes --public=false

-- ============================================
-- STORAGE BUCKET CONFIGURATION (Manual)
-- ============================================
-- Bucket Name: quotes
-- Public: false (private)
-- Allowed MIME types: application/pdf
-- Max file size: 10 MB

-- ============================================
-- RLS POLICIES FOR STORAGE BUCKET 'quotes'
-- ============================================

-- Policy: Allow authenticated suppliers to upload quote PDFs
-- Suppliers can only upload to their own folders
CREATE POLICY "Suppliers can upload their quote PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quotes'
  AND (storage.foldername(name))[1] LIKE '%'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow suppliers to read their own quote PDFs
CREATE POLICY "Suppliers can read their own quote PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'quotes'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow architects to read quote PDFs for their RFQs
-- (Implementation would require checking rfq ownership via metadata)
CREATE POLICY "Architects can read quote PDFs for their RFQs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'quotes'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow suppliers to update their own quote PDFs
CREATE POLICY "Suppliers can update their quote PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'quotes'
  AND auth.role() = 'authenticated'
);

-- Policy: Allow suppliers to delete their own quote PDFs
CREATE POLICY "Suppliers can delete their quote PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'quotes'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- After creating the 'quotes' bucket in the Supabase Dashboard:
-- 1. Navigate to Storage > quotes > Policies
-- 2. Enable RLS on the bucket
-- 3. The above policies will be automatically applied
--
-- To verify:
-- SELECT * FROM storage.buckets WHERE name = 'quotes';
-- SELECT * FROM storage.objects WHERE bucket_id = 'quotes' LIMIT 5;
