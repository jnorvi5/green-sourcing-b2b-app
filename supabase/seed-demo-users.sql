-- Demo Architect User
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'demo@architect.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"user_type":"architect","company_name":"Demo Architecture Firm","full_name":"Demo Architect"}'
) ON CONFLICT (email) DO NOTHING;

-- Demo Supplier User
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'demo@supplier.com',
  crypt('demo123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"user_type":"supplier","company_name":"EcoMaterials Inc","full_name":"Demo Supplier"}'
) ON CONFLICT (email) DO NOTHING;

-- Create public users profiles (if you have a users table)
INSERT INTO public.users (id, email, user_type, company_name, full_name, created_at)
SELECT 
  id,
  email,
  (raw_user_meta_data->>'user_type')::text,
  (raw_user_meta_data->>'company_name')::text,
  (raw_user_meta_data->>'full_name')::text,
  created_at
FROM auth.users
WHERE email IN ('demo@architect.com', 'demo@supplier.com')
ON CONFLICT (email) DO NOTHING;

-- Seed demo products for supplier
INSERT INTO public.products (
  id,
  supplier_id,
  name,
  category,
  description,
  carbon_footprint,
  certifications,
  price_per_unit,
  unit,
  created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'Low-Carbon Concrete Mix',
  'Concrete',
  'High-performance concrete with 40% lower embodied carbon. EPD-certified.',
  450.5,
  ARRAY['EPD', 'ISO 14025', 'Buy Clean'],
  125.00,
  'cubic yard',
  now()
FROM auth.users u
WHERE u.email = 'demo@supplier.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.products (
  id,
  supplier_id,
  name,
  category,
  description,
  carbon_footprint,
  certifications,
  price_per_unit,
  unit,
  created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'FSC-Certified Cross-Laminated Timber',
  'Timber',
  'Sustainably sourced CLT panels. FSC 100% certified. Carbon negative.',
  -120.0,
  ARRAY['FSC', 'PEFC', 'Cradle to Cradle'],
  850.00,
  'cubic meter',
  now()
FROM auth.users u
WHERE u.email = 'demo@supplier.com'
ON CONFLICT DO NOTHING;
