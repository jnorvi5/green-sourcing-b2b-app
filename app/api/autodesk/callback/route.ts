import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  storeConnection,
  getAutodeskUserInfo,
  decodeState,
} from '@/lib/integrations/autodesk/oauth';

// Force dynamic rendering for this route and ensure Node runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code missing' },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { error: 'State parameter missing' },
        { status: 400 }
      );
    }

    // Decode state to get user context
    let decodedState;
    try {
      decodedState = decodeState(state);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    const { user_id, redirect_uri } = decodedState;

    // Exchange code for access token
    const tokenData = await exchangeCodeForToken(code);

    // Get user info from Autodesk (optional, but good for storing email/name)
    let userInfo;
    try {
      userInfo = await getAutodeskUserInfo(tokenData.access_token);
    } catch (error) {
      console.warn('Failed to fetch Autodesk user info:', error);
    }

    // Store token in database
    await storeConnection(user_id, tokenData, userInfo);
    
    // Redirect to dashboard or the original return URL
    return NextResponse.redirect(new URL(redirect_uri || '/architect/dashboard', request.url));
  } catch (error) {
    console.error('Autodesk callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
