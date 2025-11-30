-- =====================================================
-- Enhanced Profiles Table with RBAC
-- Migration: 20251127_enhanced_rbac_profiles.sql
-- =====================================================

-- Create profiles table if it doesn't exist (links to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'buyer',
  company_name TEXT,
  job_title TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  email_verified BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Function to handle new user creation and sync to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_role user_role;
BEGIN
  -- Get role from user metadata, default to 'buyer'
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'buyer'
  );
  
  -- Insert into profiles
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    company_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role,
    NEW.raw_user_meta_data->>'company_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_profile();

-- Function to update last_login_at
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET last_login_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Function to get user role (useful for RLS and backend)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  result user_role;
BEGIN
  SELECT role INTO result
  FROM public.profiles
  WHERE id = user_id;
  RETURN result;
END;
$$;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION public.user_has_role(required_role user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_role TO authenticated;
