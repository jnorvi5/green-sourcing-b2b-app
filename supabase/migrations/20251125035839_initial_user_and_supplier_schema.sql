-- Define custom ENUM types
CREATE TYPE user_role AS ENUM ('buyer', 'supplier', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- Create the public.users table to sync with auth.users
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role user_role,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the public.suppliers table for company profiles
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT,
  description TEXT,
  website TEXT,
  verification_status verification_status DEFAULT 'pending',
  tier INT DEFAULT 1
);

-- Function and Trigger to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role'), 'buyer')::user_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS and define policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policy for users table
CREATE POLICY "Users can read/update their own data"
ON public.users
FOR ALL
USING (auth.uid() = id);

-- RLS policies for suppliers table
CREATE POLICY "Supplier profiles are publicly readable"
ON public.suppliers
FOR SELECT
USING (true);

CREATE POLICY "Suppliers can update their own profile"
ON public.suppliers
FOR UPDATE
USING (auth.uid() = id);
