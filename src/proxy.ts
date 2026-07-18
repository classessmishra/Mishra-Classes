import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const authRole = request.cookies.get('auth_role')?.value;
  const path = request.nextUrl.pathname;

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];

  if (publicPaths.includes(path)) {
    if (authRole) {
      if (authRole === 'admin' || authRole === 'teacher') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // If not logged in, redirect everything to login
  if (!authRole) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protect Admin specific routes
  if (path.startsWith('/admin') && authRole !== 'admin' && authRole !== 'teacher') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except API, static files, images, etc.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
