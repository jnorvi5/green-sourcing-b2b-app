/**
 * GET /api/autodesk/status
 * Check user's Autodesk connection status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConnection } from '@/lib/integrations/autodesk/oauth';
import type { ConnectionStatusResponse } from '@/types/autodesk';

export async function GET(request: NextRequest) {
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

    // Get connection
    const connection = await getConnection(user.id);

    if (!connection) {
      const response: ConnectionStatusResponse = {
        connected: false,
      };
      return NextResponse.json(response);
    }

    const response: ConnectionStatusResponse = {
      connected: true,
      autodesk_user_id: connection.autodesk_user_id,
      autodesk_email: connection.autodesk_email,
      expires_at: connection.expires_at,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Autodesk status error:', error);
    return NextResponse.json({ error: 'Failed to check connection status' }, { status: 500 });
  }
}
