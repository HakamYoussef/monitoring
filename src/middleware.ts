import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './actions/session';

const protectedRoutes = ['/dashboard', '/config', '/accounts'];
const publicRoutes = ['/login'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));

  const session = await getSession();

  // If Mongo is not configured, we allow access to dashboard for demo purposes
  const isDbConfigured = !!process.env.MONGODB_URI;

  if (isDbConfigured && isProtectedRoute && !session.isLoggedIn) {
    // Redirect to login page if trying to access a protected route without being logged in
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (session.isLoggedIn) {
    const isAdmin = session.role === 'admin';
    if (publicRoutes.includes(path)) {
        // Redirect logged-in users away from public routes
        const defaultDashboard = session.dashboardNames[0] || '';
        const dashboardUrl = new URL(`/dashboard/${encodeURIComponent(defaultDashboard)}`, req.nextUrl);
        return NextResponse.redirect(dashboardUrl);
    }
    if (!isAdmin) {
        // Restrict non-admin users from config, accounts, or dashboard selector
        if (path.startsWith('/config') || path.startsWith('/accounts') || path === '/dashboard') {
            const defaultDashboard = session.dashboardNames[0] || '';
            const dashboardUrl = new URL(`/dashboard/${encodeURIComponent(defaultDashboard)}`, req.nextUrl);
            return NextResponse.redirect(dashboardUrl);
        }
        if (path.startsWith('/dashboard/')) {
            const requestedDashboard = decodeURIComponent(path.split('/')[2]);
            if (session.dashboardNames.length > 0 && !session.dashboardNames.includes(requestedDashboard)) {
                const defaultDashboard = session.dashboardNames[0] || '';
                const correctDashboardUrl = new URL(`/dashboard/${encodeURIComponent(defaultDashboard)}`, req.nextUrl);
                return NextResponse.redirect(correctDashboardUrl);
            }
        }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // Matcher to specify which routes the middleware should run on.
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
