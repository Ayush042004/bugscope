import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
export { default } from 'next-auth/middleware';

// Content Security Policy – adjust 'self' + specific domains as you add external resources
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'", // baseline
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // consider removing unsafe-* after refactors
  "style-src 'self' 'unsafe-inline'", // Tailwind in dev may inline
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://generativelanguage.googleapis.com", // Gemini API
  "frame-ancestors 'none'", // no embedding
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function applySecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('X-XSS-Protection', '0'); // modern browsers rely on CSP
  res.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  // NOTE: Enable HSTS only after confirming HTTPS everywhere (production only):
  // res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/sign-up', '/',],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const url = request.nextUrl;

  // Redirect to dashboard if the user is already authenticated
  // and trying to access sign-in, sign-up, or home page
  if (
    token &&
    (url.pathname.startsWith('/sign-in') ||
      url.pathname.startsWith('/sign-up') ||
      url.pathname === '/')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!token && url.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const res = NextResponse.next();
  return applySecurityHeaders(res);
}