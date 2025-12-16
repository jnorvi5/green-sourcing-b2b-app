import { createClient } from "@supabase/supabase-js";

// This client uses the Service Role Key to bypass RLS.
// ONLY use this in server-side API routes (not in client components).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // We don't throw error immediately to avoid breaking build if envs are missing in some contexts
  // but it will fail at runtime if used.
  console.warn('Missing Supabase Service Role Key');
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
