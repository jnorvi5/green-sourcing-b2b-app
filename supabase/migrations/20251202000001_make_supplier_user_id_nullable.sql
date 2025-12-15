-- Migration to make user_id nullable in suppliers table
ALTER TABLE public.suppliers ALTER COLUMN user_id DROP NOT NULL;
