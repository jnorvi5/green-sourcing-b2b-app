import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      console.log('[AUTH] Missing credentials');
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      console.log('[AUTH] Missing env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('[AUTH] Attempt for:', email);

    // Get cookie store for setting auth cookies
    const cookieStore = await cookies();

    // Create Supabase client with cookie handling
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Sign in with email and password - this sets the session cookies automatically
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('[AUTH] FAILED:', error.message);
      return NextResponse.json(
        { error: error.message, details: { error_code: error.status } },
        { status: 401 }
      );
    }

    if (!data.session || !data.user) {
      console.log('[AUTH] FAILED: No session returned');
      return NextResponse.json(
        { error: 'Authentication failed - no session returned' },
        { status: 401 }
      );
    }

    console.log('[AUTH] SUCCESS for:', email);

    // Get user type from metadata
    const userType = data.user.user_metadata?.['user_type'] || 
                     data.user.user_metadata?.['role'] || 
                     'architect';

    return NextResponse.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        user_type: userType,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log('[AUTH] EXCEPTION:', msg.substring(0, 80));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
