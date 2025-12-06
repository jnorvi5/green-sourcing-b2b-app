import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[AUTH] Request method:', request.method);
    console.log('[AUTH] Content-Type:', request.headers.get('content-type'));

    let email, password;
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
      console.log('[AUTH] Parsed body OK');
    } catch (parseErr) {
      console.log('[AUTH] JSON parse failed:', parseErr instanceof Error ? parseErr.message : String(parseErr));
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('[AUTH] Email:', email, 'Pass length:', password?.length || 0);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('[AUTH] Env - URL:', supabaseUrl ? 'SET' : 'MISSING', 'Key:', supabaseKey ? 'SET' : 'MISSING');

    if (!supabaseUrl || !supabaseKey) {
      console.log('[AUTH] FAIL: Missing env vars');
      return NextResponse.json({ error: 'Missing config' }, { status: 500 });
    }

    const tokenUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
    console.log('[AUTH] Calling:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('[AUTH] Fetch status:', response.status);

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      console.log('[AUTH] Response parse failed:', jsonErr instanceof Error ? jsonErr.message : String(jsonErr));
      const text = await response.text();
      console.log('[AUTH] Response text:', text.substring(0, 100));
      return NextResponse.json({ error: 'Supabase error', details: text }, { status: response.status });
    }

    console.log('[AUTH] Supabase error:', data.error || 'none', 'Has token:', !!data.access_token);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Auth failed', details: data },
        { status: response.status }
      );
    }

    console.log('[AUTH] SUCCESS');
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
    console.log('[AUTH] EXCEPTION:', msg);
    return NextResponse.json({ error: msg, type: 'exception' }, { status: 500 });
  }
}
