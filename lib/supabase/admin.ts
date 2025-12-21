import { createClient } from "@supabase/supabase-js";

// This client uses the Service Role Key to bypass RLS.
// ONLY use this in server-side API routes (not in client components).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // We don't throw error immediately to avoid breaking build if envs are missing in some contexts
  // but it will fail at runtime if used.
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Missing Supabase Admin keys in production.');
  } else {
    console.warn('Missing Supabase Service Role Key - Admin client will fail if used.');
  }
}

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://mock.supabase.co',
  supabaseServiceKey || 'mock-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
