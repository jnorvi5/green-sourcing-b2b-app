// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Next.js uses process.env with NEXT_PUBLIC_ prefix for client-side env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
// Support both naming conventions for the anon key
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) as string

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
