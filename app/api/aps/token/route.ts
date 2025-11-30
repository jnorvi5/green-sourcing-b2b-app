import { NextResponse } from 'next/server';
import { getAutodeskToken } from '../../../../lib/autodesk';

// Token cache to avoid rate limiting
interface CachedToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: CachedToken | null = null;

// Token validity buffer (5 minutes before expiry)
const TOKEN_BUFFER_MS = 5 * 60 * 1000;
// Default token expiry (1 hour)
const DEFAULT_EXPIRES_IN = 3600;

export async function GET(): Promise<NextResponse> {
  try {
    const now = Date.now();

    // Return cached token if still valid
    if (cachedToken && cachedToken.expires_at > now + TOKEN_BUFFER_MS) {
      const remainingSeconds = Math.floor((cachedToken.expires_at - now) / 1000);
      console.log('[APS Token] Returning cached token, expires in', remainingSeconds, 'seconds');
      
      return NextResponse.json({
        access_token: cachedToken.access_token,
        expires_in: remainingSeconds,
      });
    }

    console.log('[APS Token] Fetching new token from Autodesk APS');
    
    const accessToken = await getAutodeskToken();
    
    if (!accessToken) {
      console.error('[APS Token] No access token returned from Autodesk');
      return NextResponse.json(
        { error: 'Failed to obtain access token' },
        { status: 500 }
      );
    }

    // Cache the new token
    cachedToken = {
      access_token: accessToken,
      expires_at: now + DEFAULT_EXPIRES_IN * 1000,
    };

    console.log('[APS Token] New token cached, expires in', DEFAULT_EXPIRES_IN, 'seconds');

    return NextResponse.json({
      access_token: accessToken,
      expires_in: DEFAULT_EXPIRES_IN,
    });
  } catch (error) {
    console.error('[APS Token] Error fetching token:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { error: `Failed to authenticate with Autodesk APS: ${errorMessage}` },
      { status: 500 }
    );
  }
}
