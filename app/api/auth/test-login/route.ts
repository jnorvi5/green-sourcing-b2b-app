import { NextRequest, NextResponse } from 'next/server';

/**
 * TEST-ONLY endpoint for demo/development
 * Bypasses Supabase for testing the login flow
 * REMOVE THIS IN PRODUCTION
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email?.trim();

    console.log('[TEST-LOGIN] Attempt for:', email);

    // Demo credentials that work
    const demoUsers = {
      'demo@architect.com': { id: 'arch-001', email: 'demo@architect.com', user_type: 'architect' },
      'demo@supplier.com': { id: 'supp-001', email: 'demo@supplier.com', user_type: 'supplier' },
    };

    const user = demoUsers[email as keyof typeof demoUsers];
    if (!user) {
      console.log('[TEST-LOGIN] User not in demo list');
      return NextResponse.json(
        { error: 'Test user not found. Use demo@architect.com or demo@supplier.com' },
        { status: 401 }
      );
    }

    // Generate a fake token for testing
    const fakeToken = `test_${user.id}_${Date.now()}`;
    
    console.log('[TEST-LOGIN] SUCCESS for:', email);
    return NextResponse.json({
      token: fakeToken,
      user: user,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log('[TEST-LOGIN] EXCEPTION:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
