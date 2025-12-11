/**
 * Supabase Browser Client
 * 
 * Client-side Supabase client for use in React client components.
 */
import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client configured for browser-side usage.
 * 
 * Use this client in React client components (components with 'use client' directive).
 * 
 * @returns Supabase client instance for browser-side usage
 */
export function createClient() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );
}
