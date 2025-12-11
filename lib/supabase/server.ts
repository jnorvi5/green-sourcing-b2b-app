/**
 * Supabase SSR Server Client
 * 
 * Server-side Supabase client with cookie handling for Next.js 14 App Router.
 * Use this in Server Components, Server Actions, and Route Handlers.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client configured for server-side rendering.
 * 
 * This client automatically handles cookie management for authentication
 * in Next.js 14 App Router server components.
 * 
 * @returns Supabase client instance configured for server-side usage
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Gets the currently authenticated user.
 * 
 * @returns The authenticated user object or null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  
  return user;
}

/**
 * Gets the user profile with role information from the profiles table.
 * 
 * @returns The user profile with role information or null if not found
 */
export async function getUserProfile() {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Error getting user:', userError?.message);
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error getting profile:', profileError.message);
    return null;
  }

  return profile;
}
