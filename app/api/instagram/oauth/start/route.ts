import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/instagram/oauth/start
 *
 * Redirects the user to Instagram's authorization page.
 * We build the URL ourselves so redirect_uri is 100% under our control.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.META_CLIENT_ID!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/instagram/oauth/callback`;

  // Generate a state token to prevent CSRF
  const state = crypto.randomBytes(16).toString('hex');

  const authUrl = new URL('https://www.instagram.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  // Store state in a short-lived cookie so we can verify it on callback
  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('ig_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  return response;
}
