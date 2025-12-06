import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('[AUTH] Email:', email);
    console.log('[AUTH] URL exists:', !!supabaseUrl, 'Key exists:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      console.log('[AUTH] FAIL: Missing env');
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 });
    }

    const tokenUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('[AUTH] Status:', response.status, 'Error:', data.error || 'none');

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Invalid credentials', details: data },
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
    console.log('[AUTH] EXCEPTION:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
