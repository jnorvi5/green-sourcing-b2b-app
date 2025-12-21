import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// This client uses the Service Role Key to bypass RLS.
// ONLY use this in server-side API routes (not in client components).

// Check if we have the necessary keys.
// If we are in a build environment or client-side, these might be missing.
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  if (env.NODE_ENV === 'production') {
    // In production runtime, this is critical.
    console.error('CRITICAL: Missing Supabase Admin keys in production.');
  } else {
    // In dev/test/build, we warn but allow execution to proceed (client might use mocks).
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
