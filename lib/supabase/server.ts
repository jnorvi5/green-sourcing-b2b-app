import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Chainable placeholder for build-time (returns null for queries)
const createChainableResult = () => {
  const result: any = {
    data: null,
    error: null,
    count: null,
  };
  
  // Add chainable methods
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 
    'like', 'ilike', 'is', 'in', 'contains', 'containedBy', 'range',
    'order', 'limit', 'offset', 'single', 'maybeSingle',
    'textSearch', 'match', 'not', 'or', 'filter',
  ];
  
  chainMethods.forEach(method => {
    result[method] = function() { return this; };
  });
  
  // Make it thenable for async/await
  result.then = (resolve: any) => resolve(result);
  
  return result;
};

const createBuildTimeClient = () => {
  const noopClient = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => createChainableResult(),
    rpc: async () => ({ data: null, error: null }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        list: async () => ({ data: [], error: null }),
        remove: async () => ({ data: null, error: null }),
      }),
    },
  };
  return noopClient as any;
};

export const createClient = async () => {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  
  // During build time without env vars, return a placeholder client that won't throw
  // This allows static pages to be generated even without real credentials
  if (!supabaseUrl || !supabaseKey) {
    // Only use placeholder during server-side build process
    if (typeof window === 'undefined') {
      console.warn('Supabase credentials not available - using placeholder for build');
      return createBuildTimeClient();
    }
    throw new Error('Missing Supabase environment variables');
  }
  
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};
