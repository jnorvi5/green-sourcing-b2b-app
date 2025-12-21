import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";

// Get environment variables at runtime
const getSupabaseConfig = () => {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  return { supabaseUrl, supabaseKey };
};

// Singleton client instance
let clientInstance: SupabaseClient | null = null;

export const createClient = () => {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }
  
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  
  if (!supabaseUrl || !supabaseKey) {
    // During build-time, throw a more descriptive error
    // This should not be called during SSG as these pages are client-side
    throw new Error('Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  }
  
  clientInstance = createBrowserClient(supabaseUrl, supabaseKey);
  return clientInstance;
};
