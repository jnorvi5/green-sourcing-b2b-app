import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, companyName, userType } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const signupUrl = `${supabaseUrl}/auth/v1/signup`;
    const signupBody = {
      email,
      password,
      data: {
        full_name: fullName,
        company_name: companyName,
        user_type: userType,
      },
    };

    const response = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
      },
      body: JSON.stringify(signupBody),
    });

    const data = await response.json();

    if (!response.ok) {
        const errorMsg = data.msg || data.error || 'Signup failed';
        return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
