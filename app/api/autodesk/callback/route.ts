import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route and ensure Node runtime
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const _state = searchParams.get('state');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code missing' },
        { status: 400 }
      );
    }

    // TODO: Exchange code for access token
    // TODO: Store token in database
    // TODO: Redirect to dashboard
    
    return NextResponse.redirect(new URL('/architect/dashboard', request.url));
  } catch (error) {
    console.error('Autodesk callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
