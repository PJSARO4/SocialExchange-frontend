import { NextResponse, NextRequest } from 'next/server';

/**
 * Next.js Middleware - Security Headers
 *
 * Applies security headers to all matched responses
 */

export function middleware(request: NextRequest) {
  // -------------------------------------------
  // Security Headers (applied to ALL routes)
  // -------------------------------------------
  const response = NextResponse.next();

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

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.cdninstagram.com https://*.fbcdn.net",
      "media-src 'self' blob:",
      "connect-src 'self' https://graph.instagram.com https://graph.facebook.com https://api.instagram.com https://*.vercel.app",
      "frame-ancestors 'none'",
    ].join('; ')
  );

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
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
