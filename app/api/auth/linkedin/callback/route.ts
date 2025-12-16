import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateToken } from '@/lib/auth/jwt';
import { isCorporateEmail, getTrustScoreForEmail } from '@/lib/auth/corporate-domains';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const callbackUrl = process.env.LINKEDIN_CALLBACK_URL;

    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl!,
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
        console.error('LinkedIn Token Error:', tokenData);
        return NextResponse.json({ error: 'Failed to get access token' }, { status: 401 });
    }

    // 2. Fetch User Profile
    const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileResponse.json();
    /* Profile format:
       {
         "sub": "782sd...",
         "name": "John Doe",
         "given_name": "John",
         "family_name": "Doe",
         "picture": "https://...",
         "email": "john@example.com",
         "email_verified": true
       }
    */

    if (!profile.email) {
       return NextResponse.json({ error: 'No email provided by LinkedIn' }, { status: 400 });
    }

    const email = profile.email;
    const linkedinId = profile.sub;

    // 3. Check if user exists
    let { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (!user) {
       // Create new user
       const isCorporate = isCorporateEmail(email);
       const trustScore = getTrustScoreForEmail(email);

       const { data: newUser, error: createError } = await supabaseAdmin
         .from('users')
         .insert({
           email,
           linkedin_id: linkedinId,
           full_name: profile.name,
           avatar_url: profile.picture,
           role: 'architect', // Default role per instructions
           email_verified: true, // Trusted from LinkedIn
           corporate_verified: isCorporate,
           trust_score: trustScore,
           verification_method: 'linkedin'
         })
         .select()
         .single();

       if (createError) throw createError;
       user = newUser;
    } else {
       // Link LinkedIn to existing account
       if (!user.linkedin_id) {
           await supabaseAdmin
             .from('users')
             .update({ linkedin_id: linkedinId, avatar_url: profile.picture || user.avatar_url })
             .eq('id', user.id);
       }
    }

    // 4. Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // 5. Return Token & Redirect URL (Client will handle redirect)
    // The prompt says "Redirect to: /architect/dashboard?authenticated=true"
    // Since this is a POST endpoint called by client after receiving code?
    // Wait, typical OAuth flow:
    // GET /api/auth/linkedin -> Redirects user to LinkedIn
    // LinkedIn redirects to Frontend /auth/callback?code=... OR Backend /api/auth/linkedin/callback?code=...
    // The prompt says: "Endpoint: POST /api/auth/linkedin/callback ... Input: { code }"
    // This implies the Frontend receives the code from LinkedIn (via redirect to frontend page) and then POSTs it to this API.
    // If the backend was the redirect target, it would be a GET.
    // So I will assume Frontend handles the redirect capture and calls this POST.

    const response = NextResponse.json({
        token,
        userId: user.id,
        role: user.role,
        redirectUrl: `/${user.role}/dashboard?authenticated=true`
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('LinkedIn Callback Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
