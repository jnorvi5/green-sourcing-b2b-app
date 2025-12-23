import { createBrowserClient } from "@supabase/ssr";

// STRICT SECURITY CHECK
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This ensures the build fails if keys are missing, preventing runtime crashes
  throw new Error(
    'CRITICAL: Supabase environment variables are missing. Check .env.local'
  );
}

// Singleton client instance
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (clientInstance) return clientInstance;

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return clientInstance;
};
