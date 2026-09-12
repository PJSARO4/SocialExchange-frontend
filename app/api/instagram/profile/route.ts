import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import {
  getTenantUser,
  notFound,
  resolveConnectedOwnedFeed,
  unauthorized,
} from '@/lib/security/tenant';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/instagram/profile?feedId=<optional>
 *
 * Returns the authenticated user's own Instagram profile with metrics.
 *
 * SEC-1 — CONTRACT CHANGE
 *
 * This route previously had no session check and took `access_token` as a
 * QUERY PARAMETER. That put a live Instagram credential in the URL — where it
 * lands in browser history, referrers, proxy logs and server access logs — and
 * let any unauthenticated caller use any token they obtained.
 *
 * The token is now resolved SERVER-SIDE from a SocialFeed the session user
 * owns. The client names the feed; the server decides whether it may be used.
 * This follows the existing secure pattern in /api/instagram/recent.
 *
 * Metric semantics are untouched: the same `followers_count` profile field is
 * requested and returned under the same response keys.
 */
export async function GET(request: NextRequest) {
  // Fail loudly rather than silently ignoring a token in the URL, so any
  // un-migrated caller is found immediately instead of leaking a credential.
  if (request.nextUrl.searchParams.has('access_token')) {
    return NextResponse.json(
      {
        error:
          'access_token is no longer accepted in the query string. Pass feedId; the server resolves the token.',
      },
      { status: 400 }
    );
  }

  const user = await getTenantUser();
  if (!user) return unauthorized();

  const feedId = request.nextUrl.searchParams.get('feedId');
  const feed = await resolveConnectedOwnedFeed(user.id, feedId);

  // OAuth BOOTSTRAP FALLBACK.
  //
  // During the very first Instagram connection the profile is fetched before
  // the SocialFeed row exists, so there is nothing to own yet. In that one case
  // we fall back to the caller's OWN token as carried on their server session —
  // read server-side via getServerSession, never accepted from the request.
  // It is still the authenticated user's own credential, so no tenant boundary
  // is crossed; it simply has no feed row behind it yet.
  let accessToken = feed?.accessToken ?? '';
  if (!accessToken && !feedId) {
    const session = await getServerSession(authOptions);
    accessToken = ((session?.user as any)?.accessToken as string | undefined) ?? '';
  }

  if (!accessToken) return notFound('Feed');

  try {
    // Fetch user profile with business account fields
    // Note: followers_count and media_count require instagram_business_basic permission
    const fields = [
      'id',
      'username',
      'name',
      'account_type',
      'profile_picture_url',
      'followers_count',
      'follows_count',
      'media_count',
      'biography',
    ].join(',');

    const url = `https://graph.instagram.com/me?fields=${fields}&access_token=${encodeURIComponent(
      accessToken
    )}`;

    console.log('📊 Fetching Instagram profile data...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      // Never log the upstream body here: it can echo the request URL, which
      // carries the access token.
      console.error('❌ Instagram API Error:', data.error?.message || 'unknown');
      return NextResponse.json(
        { error: data.error.message || 'Failed to fetch Instagram data' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: data.id,
      username: data.username,
      name: data.name,
      accountType: data.account_type,
      profilePictureUrl: data.profile_picture_url,
      followersCount: data.followers_count,
      followsCount: data.follows_count,
      mediaCount: data.media_count,
      biography: data.biography,
    });
  } catch (error) {
    console.error('❌ Error fetching Instagram profile');
    return NextResponse.json(
      { error: 'Failed to fetch Instagram profile' },
      { status: 500 }
    );
  }
}
