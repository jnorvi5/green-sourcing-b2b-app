/**
 * POST /api/autodesk/connect
 * Initiates OAuth 2.0 flow with Autodesk
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateAuthorizationUrl } from '@/lib/integrations/autodesk/oauth';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get optional redirect URI from request body
    const body = await request.json().catch(() => ({}));
    const redirectUri = body.redirect_uri || '/carbon-analysis';

    // Generate authorization URL
    const authUrl = generateAuthorizationUrl(user.id, redirectUri);

    return NextResponse.json({
      authorization_url: authUrl,
    });
  } catch (error) {
    console.error('Autodesk connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Autodesk connection' },
      { status: 500 }
    );
  }
}
