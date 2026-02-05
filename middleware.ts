// Middleware to protect routes
// Only landing page (/) is public, everything else requires authentication

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const isAuthenticated = !!req.nextauth.token;

    // If authenticated and trying to access signin, redirect to dashboard
    if (isAuthenticated && pathname === '/auth/signin') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        const publicRoutes = ['/', '/auth/signin', '/auth/error'];

        // Allow public routes
        if (publicRoutes.includes(pathname)) {
          return true;
        }

        // Require auth for all other routes
        return !!token;
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
);

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
