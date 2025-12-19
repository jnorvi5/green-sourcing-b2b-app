import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const { email, verificationCode } = await req.json();

    if (!email || !verificationCode) {
      return NextResponse.json(
        { error: 'Email and verification code required' },
        { status: 400 }
      );
    }

    // 1. Fetch user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.email_verified) {
      return NextResponse.json({ message: 'Email already verified', verified: true });
    }

    // 2. Check code validity
    if (user.verification_code !== verificationCode) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
    }

    if (new Date(user.verification_code_expiry) < new Date()) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 });
    }

    // 3. Mark verified
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        verification_code: null,
        verification_code_expiry: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // 4. Send Welcome Email (Mock)
    console.log(`[MOCK EMAIL] Welcome to GreenChainz, ${email}!`);

    // 5. Generate Token so they are logged in? Prompt says "Return: { verified: true, nextStep: 'complete-profile' }"
    // It doesn't explicitly ask for a token here, but it's good UX.
    // However, following prompt strict return:

    return NextResponse.json({ verified: true, nextStep: 'complete-profile' });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
