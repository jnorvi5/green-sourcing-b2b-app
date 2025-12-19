import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const callbackUrl = process.env.LINKEDIN_CALLBACK_URL;

  if (!clientId || !callbackUrl) {
    return NextResponse.json({ error: 'LinkedIn auth not configured' }, { status: 500 });
  }

  const scope = 'openid profile email'; // Standard OIDC scopes
  const state = Math.random().toString(36).substring(7); // CSRF protection (simple)

  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&state=${state}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.redirect(url);
}
