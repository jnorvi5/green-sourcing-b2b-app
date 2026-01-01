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

    if (error) {
      console.error('Database error during login:', error);
      // Don't expose database errors to client, but log them
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    if (!user) {
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
    // Response structure must match what the client expects: data.user.user_type
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_type: user.role, // Client expects user_type, not accountType
        full_name: user.full_name || null,
      },
      token // Return token in body as well for client convenience (though cookie is safer)
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
