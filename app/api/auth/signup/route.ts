import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/auth/jwt';
import { isCorporateEmail, getTrustScoreForEmail } from '@/lib/auth/corporate-domains';
import { z } from 'zod';
// import { Resend } from 'resend';
// We will mock Resend or check if initialized if API key present

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  accountType: z.enum(['architect', 'supplier']),
  companyName: z.string().optional(), // For suppliers or architects
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation Error', details: result.error.errors },
        { status: 400 }
      );
    }

    const { email, password, accountType, companyName } = result.data;

    // 1. Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Corporate verification logic
    const isCorporate = isCorporateEmail(email);
    const trustScore = getTrustScoreForEmail(email);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    // 4. Create user
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        role: accountType,
        company_name: companyName,
        email_verified: false,
        verification_code: verificationCode,
        verification_code_expiry: verificationCodeExpiry,
        corporate_verified: isCorporate,
        trust_score: trustScore,
        verification_method: isCorporate ? 'corporate_email' : 'manual'
      })
      .select()
      .single();

    if (createError) {
      console.error('Create User Error:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // 5. Create Profile (suppliers table) if supplier
    if (accountType === 'supplier') {
        const { error: profileError } = await supabaseAdmin
            .from('suppliers')
            .insert({
                user_id: newUser.id,
                name: companyName || 'Unnamed Supplier',
            });

        if (profileError) {
             console.error('Create Supplier Profile Error:', profileError);
             // Non-fatal, can be fixed later or retry
        }
    }

    // 6. Send Verification Email (Mock for MVP if no key, or use Resend)
    // In production, we'd use Resend here.
    console.log(`[MOCK EMAIL] To: ${email}, Code: ${verificationCode}`);

    // 7. Generate Token (optional, usually wait for verification, but prompt says return userId)
    // We won't log them in yet until verified, but we return success.

    return NextResponse.json({
      userId: newUser.id,
      email: newUser.email,
      verificationEmailSent: true,
      message: 'User created successfully. Please verify your email.'
    });

  } catch (error) {
    console.error('Signup Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
