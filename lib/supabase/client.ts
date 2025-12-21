import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";
import { env } from "@/lib/env";

// Singleton client instance
let clientInstance: SupabaseClient | null = null;

export const createClient = () => {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }
  
  // env.* will throw or log if missing (based on lib/env.ts logic)
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Safe fallback for build time / static generation if strictly required vars are missing
  // lib/env.ts already handles the validation, but if we want to allow the build to proceed
  // even with invalid envs (e.g. by using mocks), we can handle it here.
  // However, since NEXT_PUBLIC_SUPABASE_URL is marked required in env.ts,
  // we assume it is present or we are in a mode where env.ts allows it.
  
  if (!supabaseUrl || !supabaseKey) {
    // If we are in production build and these are missing, we can't really proceed for a real app.
    // But for "next build" in CI without secrets, we might want to mock it.
    if (env.NODE_ENV === 'production') {
       // Check if we are actually in a Vercel build phase (CI) where we might want to skip this error?
       // Usually Vercel has the env vars.
       // If this is a local build without .env, we can return a mock client to let SSG finish.
    }

    // Attempt to provide a mock client for build safety if no URL is present
    console.warn("⚠️  Supabase keys missing in createClient. Using mock for build/SSG safety.");
    return createBrowserClient('https://mock.supabase.co', 'mock-key');
  }
  
  clientInstance = createBrowserClient(supabaseUrl, supabaseKey);
  return clientInstance;
};
