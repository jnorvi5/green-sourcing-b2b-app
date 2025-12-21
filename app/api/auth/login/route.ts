import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // 1. Find user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 2. Validate password
    // If user is OAuth only (no password_hash), this will fail correctly or we handle it.
    if (!user.password_hash) {
       return NextResponse.json({ error: 'Please login with LinkedIn' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Check if email verified? Prompt implies strict security but MVP might allow login without it?
    // Usually strict. Let's check verify-email flow.
    // If not verified, maybe return 403?
    if (!user.email_verified) {
        return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
    }

    // 3. Generate Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // 4. Set HttpOnly Cookie
    const response = NextResponse.json({
      userId: user.id,
      email: user.email,
      accountType: user.role,
      token // Return token in body as well for client convenience (though cookie is safer)
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
