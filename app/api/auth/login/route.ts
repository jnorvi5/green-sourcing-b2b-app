import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      console.log('[AUTH] Missing credentials');
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.log('[AUTH] Missing env: URL=' + !!supabaseUrl + ' Key=' + !!supabaseKey);
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('[AUTH] Attempt for:', email);

    // Supabase expects grant_type in the body, not URL
    const tokenUrl = `${supabaseUrl}/auth/v1/token`;
    const authBody = {
      email,
      password,
      grant_type: 'password',
    };

    console.log('[AUTH] POST to:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify(authBody),
    });

    const data = await response.json();
    console.log('[AUTH] Response status:', response.status);
    console.log('[AUTH] Has access_token:', !!data.access_token);
    console.log('[AUTH] Error field:', data.error || 'none');

    // Supabase returns 200 even on some errors, check for token
    if (!data.access_token) {
      console.log('[AUTH] No token. Full response keys:', Object.keys(data));
      const errorMsg = data.error_description || data.error || 'Authentication failed';
      return NextResponse.json(
        { error: errorMsg, details: data },
        { status: 401 }
      );
    }

    console.log('[AUTH] SUCCESS for:', email);
    return NextResponse.json({
      token: data.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        user_type: 'architect',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log('[AUTH] EXCEPTION:', msg.substring(0, 100));
    return NextResponse.json({ error: 'Server error: ' + msg }, { status: 500 });
  }
}
