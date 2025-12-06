import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('=== AUTH DEBUG START ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Email:', email);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);
    console.log('Key length:', supabaseKey?.length);

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing env vars');
      console.log('=== AUTH DEBUG END ===');
      return NextResponse.json(
        { error: 'Missing Supabase config' },
        { status: 500 }
      );
    }

    console.log('📡 Calling Supabase token endpoint...');
    const tokenUrl = `${supabaseUrl}/auth/v1/token?grant_type=password`;
    console.log('URL:', tokenUrl);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    console.log('📩 Supabase Response:');
    console.log('  Status:', response.status);
    console.log('  Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('❌ Auth failed:', data.error || data.error_description);
      console.log('=== AUTH DEBUG END ===');
      return NextResponse.json(
        { error: data.error || 'Invalid credentials', details: data },
        { status: 401 }
      );
    }

    console.log('✅ Auth successful for:', email);
    console.log('User ID:', data.user?.id);
    console.log('=== AUTH DEBUG END ===');

    return NextResponse.json({
      token: data.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        user_type: 'architect',
      },
    });
  } catch (error) {
    console.log('❌ Exception caught:');
    console.log('  Type:', error instanceof Error ? error.constructor.name : typeof error);
    console.log('  Message:', error instanceof Error ? error.message : String(error));
    console.log('  Stack:', error instanceof Error ? error.stack : 'N/A');
    console.log('=== AUTH DEBUG END ===');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Auth failed' },
      { status: 500 }
    );
  }
}
