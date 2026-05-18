import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(
  request: NextRequest,
) {
  const token =
    request.cookies.get('token')?.value;

  const isAuthPage =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup';

  const isDashboard =
    request.nextUrl.pathname.startsWith(
      '/dashboard',
    );

  // Not logged in → block dashboard
  if (!token && isDashboard) {
    return NextResponse.redirect(
      new URL('/login', request.url),
    );
  }

  // Already logged in → prevent login/signup access
  if (token && isAuthPage) {
    return NextResponse.redirect(
      new URL('/dashboard', request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
};