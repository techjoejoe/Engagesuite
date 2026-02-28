import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
    '/dashboard',
    '/host',
    '/play',
    '/student',
    '/profile',
    '/redeem',
    '/admin',
    '/leaderboard',
    '/picpick/admin',
];

// Routes that are exempted from auth even if they match a protected prefix
const EXEMPTED_ROUTES = [
    '/host/class/', // Projector view — displayed on screens without login
];

// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ['/login', '/signup'];

// Public routes that never need auth
const PUBLIC_ROUTES = ['/', '/join', '/picpick', '/templates/public', '/sitemap.xml'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Firebase Auth stores the session in an __session cookie or
    // we check for the Firebase auth token cookie
    const hasSession = request.cookies.has('__session') ||
        request.cookies.has('firebaseAuth');

    // Allow public routes and API/static assets to pass through
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') || // Static files (images, fonts, etc.)
        PUBLIC_ROUTES.some(route => pathname === route)
    ) {
        return NextResponse.next();
    }

    // Check if this route is exempted (e.g. projector view)
    const isExempted = EXEMPTED_ROUTES.some(route =>
        pathname.startsWith(route)
    );

    if (isExempted) {
        return NextResponse.next();
    }

    // Check if this is a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some(route =>
        pathname.startsWith(route)
    );

    // For protected routes without a session cookie, redirect to login
    // Note: Firebase client-side auth may still authenticate the user after redirect,
    // but this prevents the flash of protected content for truly unauthenticated users
    if (isProtectedRoute && !hasSession) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Match all routes except static files and API routes
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ico)$).*)',
    ],
};
