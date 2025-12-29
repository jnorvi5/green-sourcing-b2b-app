import { createBrowserClient } from "@supabase/ssr";

// Safe Supabase Client Helper
// Checks for ANON_KEY or PUBLISHABLE_DEFAULT_KEY (Azure specific)
// Prevents "URL required" crash if env vars are missing (e.g. during build)

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'];

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  if (clientInstance) return clientInstance;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("⚠️ Supabase keys missing. Returning safe mock client to prevent crash.");
    return createBrowserClient("https://placeholder.supabase.co", "placeholder", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (..._args: unknown[]) => {
          console.warn("Supabase fetch blocked: Missing API keys.");
          return Promise.reject("Missing API keys");
        },
      },
    });
  }

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return clientInstance;
};
