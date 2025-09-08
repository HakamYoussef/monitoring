import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserSessionSchema } from '@/lib/types';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session')?.value;
  const { pathname } = request.nextUrl;

  // Allow access to the login page
  if (pathname === '/login') {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const session = UserSessionSchema.parse(JSON.parse(sessionCookie));

    // If user is 'user', they can only access the display page ('/').
    if (session.role === 'user' && pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Admins can access everything.
    return NextResponse.next();
    
  } catch (error) {
    // If session is invalid, redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('user_session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
