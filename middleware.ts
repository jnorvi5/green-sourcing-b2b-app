import { auth } from "@/app/app.auth"
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname.startsWith('/login')

  // Redirect to login if not authenticated and trying to access protected routes
  if (!isLoggedIn && !isOnLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect to dashboard if already authenticated and trying to access login page
  if (isLoggedIn && isOnLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rfq/:path*',
    '/rfqs/:path*',
    '/api/rfq/:path*',
    '/supplier/:path*',
    '/login',
  ],
};
