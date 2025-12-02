/**
 * GET /api/autodesk/callback
 * OAuth 2.0 callback handler
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  getAutodeskUserInfo,
  storeConnection,
  decodeState,
} from '@/lib/integrations/autodesk/oauth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateEncoded = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get('error_description') || 'Authorization failed';
      return NextResponse.redirect(
        new URL(`/carbon-analysis?error=${encodeURIComponent(errorDescription)}`, request.url)
      );
    }

    if (!code || !stateEncoded) {
      return NextResponse.redirect(
        new URL('/carbon-analysis?error=Invalid callback parameters', request.url)
      );
    }

    // Decode state
    const state = decodeState(stateEncoded);

    // Validate state timestamp (prevent replay attacks)
    const stateAge = Date.now() - state.timestamp;
    if (stateAge > 10 * 60 * 1000) {
      // 10 minutes
      return NextResponse.redirect(
        new URL('/carbon-analysis?error=Authorization expired', request.url)
      );
    }

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code);

    // Get user info
    const userInfo = await getAutodeskUserInfo(tokenData.access_token);

    // Store connection in database
    await storeConnection(state.user_id, tokenData, userInfo);

    // Redirect to original page
    const redirectUrl = new URL(state.redirect_uri, request.url);
    redirectUrl.searchParams.set('autodesk_connected', 'true');

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('Autodesk callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/carbon-analysis?error=${encodeURIComponent('Failed to connect to Autodesk')}`,
        request.url
      )
    );
  }
}
