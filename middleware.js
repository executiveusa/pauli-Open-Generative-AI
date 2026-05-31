import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl;
  const { pathname } = url;

  // Auth check for protected app routes
  const isAppRoute = pathname.startsWith('/app/') || pathname === '/app';
  const isClientRoute = pathname.startsWith('/client');
  const isApiRoute = pathname.startsWith('/api/v1/');

  // Allow public routes unconditionally
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/health') ||
    pathname === '/' ||
    pathname.startsWith('/landing') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // In LOCAL_DEV_AUTH mode skip session enforcement
  if (process.env.LOCAL_DEV_AUTH === 'true') {
    return NextResponse.next();
  }

  // Inject tenant context headers for API routes when session token present
  if (isApiRoute || isAppRoute || isClientRoute) {
    const sessionToken =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!sessionToken) {
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/app/:path*',
    '/client/:path*',
    '/api/v1/:path*',
  ],
};
