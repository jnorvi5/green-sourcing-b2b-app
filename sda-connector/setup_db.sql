INSERT INTO api_keys (key, description, jurisdictions, active, expires_at)
VALUES (
  'gc_sda_test_key_dev',
  'Test key for local development',
  ARRAY['US', 'CA', 'EU']::text[],
  true,
  '2026-12-31'::timestamp
);
