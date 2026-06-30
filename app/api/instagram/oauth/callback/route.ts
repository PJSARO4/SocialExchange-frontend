import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/instagram/oauth/callback
 *
 * Instagram redirects here after the user authorizes.
 * We exchange the code for a token and store it in the DB.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXTAUTH_URL!;
  const redirectUri = `${baseUrl}/api/instagram/oauth/callback`;

  // Handle Instagram-side errors
  if (error) {
    console.error('[IG OAuth] Instagram returned error:', error, searchParams.get('error_reason'));
    return NextResponse.redirect(`${baseUrl}/cockpit/my-e-assets/my-feeds?ig_error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/cockpit/my-e-assets/my-feeds?ig_error=no_code`);
  }

  // Verify state cookie
  const storedState = request.cookies.get('ig_oauth_state')?.value;
  if (!storedState || storedState !== state) {
    console.error('[IG OAuth] State mismatch', { storedState, state });
    return NextResponse.redirect(`${baseUrl}/cockpit/my-e-assets/my-feeds?ig_error=state_mismatch`);
  }

  // Get current user session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(`${baseUrl}/auth/signin`);
  }

  const userId = (session.user as any).id;
  const clientId = process.env.INSTAGRAM_CLIENT_ID || process.env.META_CLIENT_ID!;
  const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || process.env.META_CLIENT_SECRET!;

  // Exchange code for token
  console.log('[IG OAuth] Exchanging code, redirectUri:', redirectUri, 'clientId:', clientId);

  let accessToken: string;
  let igUserId: string;

  try {
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    console.log('[IG OAuth] Token response:', JSON.stringify(tokenData));

    if (tokenData.error_type || tokenData.error_message) {
      throw new Error(tokenData.error_message || 'Token exchange failed');
    }

    accessToken = tokenData.access_token;
    igUserId = tokenData.user_id?.toString();
  } catch (err: any) {
    console.error('[IG OAuth] Token exchange failed:', err.message);
    return NextResponse.redirect(`${baseUrl}/cockpit/my-e-assets/my-feeds?ig_error=${encodeURIComponent(err.message)}`);
  }

  // Fetch Instagram profile
  let profile: any = {};
  try {
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,name,biography,followers_count,follows_count,media_count,profile_picture_url&access_token=${accessToken}`
    );
    profile = await profileRes.json();
    console.log('[IG OAuth] Profile:', JSON.stringify({ id: profile.id, username: profile.username, account_type: profile.account_type }));
  } catch (err) {
    console.warn('[IG OAuth] Could not fetch profile:', err);
  }

  // Exchange for long-lived token (60-day)
  let longLivedToken = accessToken;
  let tokenExpires: Date | null = null;
  try {
    const llRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${accessToken}`
    );
    const llData = await llRes.json();
    if (llData.access_token) {
      longLivedToken = llData.access_token;
      tokenExpires = new Date(Date.now() + (llData.expires_in || 5184000) * 1000);
      console.log('[IG OAuth] Got long-lived token, expires:', tokenExpires);
    }
  } catch (err) {
    console.warn('[IG OAuth] Could not get long-lived token, using short-lived:', err);
  }

  // Upsert the Feed in the database
  try {
    const platformAccountId = profile.id || igUserId;
    const handle = profile.username ? `@${profile.username}` : `@${platformAccountId}`;

    await prisma.socialFeed.upsert({
      where: {
        userId_platform_platformAccountId: {
          userId,
          platform: 'INSTAGRAM',
          platformAccountId,
        },
      },
      update: {
        accessToken: longLivedToken,
        accessTokenExpires: tokenExpires,
        isConnected: true,
        lastSyncAt: new Date(),
        followers: profile.followers_count ?? null,
        following: profile.follows_count ?? null,
        postsCount: profile.media_count ?? null,
        profilePictureUrl: profile.profile_picture_url ?? null,
        displayName: profile.name || profile.username || handle,
        handle,
      },
      create: {
        userId,
        platform: 'INSTAGRAM',
        platformAccountId,
        handle,
        displayName: profile.name || profile.username || handle,
        profilePictureUrl: profile.profile_picture_url ?? null,
        accessToken: longLivedToken,
        accessTokenExpires: tokenExpires,
        isConnected: true,
        lastSyncAt: new Date(),
        followers: profile.followers_count ?? null,
        following: profile.follows_count ?? null,
        postsCount: profile.media_count ?? null,
      },
    });

    console.log('[IG OAuth] Feed saved to DB for user:', userId, 'account:', platformAccountId);
  } catch (dbErr: any) {
    console.error('[IG OAuth] DB save failed:', dbErr.message);
    return NextResponse.redirect(`${baseUrl}/cockpit/my-e-assets/my-feeds?ig_error=db_save_failed`);
  }

  // Clear state cookie and redirect to My Feeds
  const response = NextResponse.redirect(`${baseUrl}/cockpit/my-e-assets/my-feeds?connected=instagram`);
  response.cookies.delete('ig_oauth_state');
  return response;
}
