import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './actions/session';

const protectedRoutes = ['/dashboard', '/config', '/accounts'];
const publicRoutes = ['/login'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

  const session = await getSession();

  if (isProtectedRoute && !session.isLoggedIn) {
    // Redirect to login page if trying to access a protected route without being logged in
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (session.isLoggedIn) {
     if (publicRoutes.includes(path)) {
        // If the user is logged in, redirect them from public routes to their assigned dashboard
        const dashboardUrl = new URL(`/dashboard/${encodeURIComponent(session.dashboardName || '')}`, req.nextUrl);
        return NextResponse.redirect(dashboardUrl);
    }
    // If user is logged in and trying to access a specific dashboard,
    // ensure it's the one they are assigned to.
    if (path.startsWith('/dashboard/')) {
        const requestedDashboard = decodeURIComponent(path.split('/')[2]);
        if (session.dashboardName !== requestedDashboard) {
            // If it's not their assigned dashboard, redirect them to the correct one.
            const correctDashboardUrl = new URL(`/dashboard/${encodeURIComponent(session.dashboardName || '')}`, req.nextUrl);
            return NextResponse.redirect(correctDashboardUrl);
        }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // Matcher to specify which routes the middleware should run on.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
