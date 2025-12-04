import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple password protection
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'greenchainz2026';

export function middleware(request: NextRequest) {
  // Allow API routes to work without auth
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('gc_auth');
  
  if (authCookie?.value === ADMIN_PASSWORD) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to login
  if (request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/agents',
    '/admin/:path*',
    '/data-licensing',
  ],
};
