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

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      console.log('[AUTH] Missing env');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('[AUTH] Attempt for:', email);

    const tokenUrl = `${supabaseUrl}/auth/v1/token`;
    const authBody = {
      email,
      password,
      grant_type: 'password',
    };

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify(authBody),
    });

    const data = await response.json();
    console.log('[AUTH] Status:', response.status, 'Keys:', Object.keys(data).join(','));

    // Log the actual error message
    if (data.msg) console.log('[AUTH] Message:', data.msg);
    if (data.error_code) console.log('[AUTH] Error code:', data.error_code);
    if (data.code) console.log('[AUTH] Code:', data.code);
    if (data.error) console.log('[AUTH] Error field:', data.error);

    // Check for success
    if (data.access_token) {
      console.log('[AUTH] SUCCESS');
      return NextResponse.json({
        token: data.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          user_type: 'architect',
        },
      });
    }

    // Handle error response
    const errorMsg = data.msg || data.error || data.error_code || 'Authentication failed';
    console.log('[AUTH] FAILED:', errorMsg);
    return NextResponse.json(
      { error: errorMsg, details: data },
      { status: 401 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log('[AUTH] EXCEPTION:', msg.substring(0, 80));
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
