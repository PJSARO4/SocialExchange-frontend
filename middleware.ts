import { NextResponse } from 'next/server';

/**
 * Next.js Middleware - Security Headers
 *
 * Applies security headers to all matched responses.
 */
export function middleware() {
  const response = NextResponse.next();

  // -------------------------------------------
  // 1. Security Headers (applied to ALL routes)
  // -------------------------------------------

  // Prevent clickjacking - page cannot be embedded in iframes
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME-type sniffing attacks
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Control referrer information sent with requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enable browser XSS filter (legacy but still useful for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent DNS prefetching to reduce privacy leakage
  response.headers.set('X-DNS-Prefetch-Control', 'off');

  // Restrict permissions/features the browser can use
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Basic rate-limiting signal headers (informational for downstream proxies)
  response.headers.set('X-RateLimit-Policy', 'default');

  // Route protection: Currently handled client-side via localStorage auth.
  // TODO: Add server-side route protection once auth migrates to cookies/next-auth.

  return response;
}

/**
 * Matcher configuration:
 * Apply middleware to all routes EXCEPT:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico and other root-level static assets
 * - public folder assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
