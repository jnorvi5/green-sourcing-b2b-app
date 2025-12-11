/**
 * Autodesk Platform Services OAuth 2.0 Handler
 * Implements 3-legged OAuth flow for user authorization
 */

import { createClient } from '@supabase/supabase-js';
import type {
  AutodeskTokenResponse,
  AutodeskUserInfo,
  OAuthState,
  AutodeskConnection,
} from '@/types/autodesk';

const AUTODESK_CLIENT_ID = process.env['AUTODESK_CLIENT_ID']!;
const AUTODESK_CLIENT_SECRET = process.env['AUTODESK_CLIENT_SECRET']!;
const AUTODESK_CALLBACK_URL =
  process.env['AUTODESK_CALLBACK_URL'] || 'http://localhost:3001/api/autodesk/callback';

const AUTODESK_AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/authorize';
const AUTODESK_TOKEN_URL = 'https://developer.api.autodesk.com/authentication/v2/token';
const AUTODESK_USERINFO_URL = 'https://developer.api.autodesk.com/userprofile/v1/users/@me';

const SCOPES = ['data:read', 'data:write', 'data:create', 'viewables:read'];

/**
 * Generate OAuth authorization URL
 */
export function generateAuthorizationUrl(userId: string, redirectUri?: string): string {
  const state: OAuthState = {
    user_id: userId,
    redirect_uri: redirectUri || '/carbon-analysis',
    timestamp: Date.now(),
  };

  const stateEncoded = Buffer.from(JSON.stringify(state)).toString('base64');

  const params = new URLSearchParams({
    client_id: AUTODESK_CLIENT_ID,
    response_type: 'code',
    redirect_uri: AUTODESK_CALLBACK_URL,
    scope: SCOPES.join(' '),
    state: stateEncoded,
  });

  return `${AUTODESK_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<AutodeskTokenResponse> {
  const response = await fetch(AUTODESK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: AUTODESK_CLIENT_ID,
      client_secret: AUTODESK_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: AUTODESK_CALLBACK_URL,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AutodeskTokenResponse> {
  const response = await fetch(AUTODESK_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: AUTODESK_CLIENT_ID,
      client_secret: AUTODESK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get Autodesk user info
 */
export async function getAutodeskUserInfo(accessToken: string): Promise<AutodeskUserInfo> {
  const response = await fetch(AUTODESK_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Store Autodesk connection in database
 */
export async function storeConnection(
  userId: string,
  tokenData: AutodeskTokenResponse,
  userInfo?: AutodeskUserInfo
): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  const { error } = await supabase.from('autodesk_connections').upsert(
    {
      user_id: userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt.toISOString(),
      autodesk_user_id: userInfo?.userId,
      autodesk_email: userInfo?.emailId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  );

  if (error) {
    throw new Error(`Failed to store connection: ${error.message}`);
  }
}

/**
 * Get user's Autodesk connection
 */
export async function getConnection(userId: string): Promise<AutodeskConnection | null> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  const { data, error } = await supabase
    .from('autodesk_connections')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to get connection: ${error.message}`);
  }

  return data as AutodeskConnection;
}

/**
 * Get valid access token (auto-refresh if expired)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const connection = await getConnection(userId);

  if (!connection) {
    throw new Error('No Autodesk connection found. Please connect your Autodesk account.');
  }

  const expiresAt = new Date(connection.expires_at);
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  // Check if token is expired or will expire soon
  if (expiresAt.getTime() - now.getTime() < bufferTime) {
    // Refresh the token
    const tokenData = await refreshAccessToken(connection.refresh_token);
    await storeConnection(userId, tokenData);
    return tokenData.access_token;
  }

  return connection.access_token;
}

/**
 * Revoke Autodesk connection
 */
export async function revokeConnection(userId: string): Promise<void> {
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
  );

  const { error } = await supabase.from('autodesk_connections').delete().eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to revoke connection: ${error.message}`);
  }
}

/**
 * Decode OAuth state parameter
 */
export function decodeState(stateEncoded: string): OAuthState {
  try {
    const decoded = Buffer.from(stateEncoded, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    throw new Error('Invalid state parameter');
  }
}
