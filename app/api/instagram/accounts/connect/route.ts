import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/instagram/accounts/connect
 * Persist the OAuth token + account info as a SocialFeed row in the database.
 * The publish/scheduler routes resolve the access token from this row, so a
 * feed MUST exist here for end-to-end posting to work.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      instagramUserId,
      handle,
      displayName,
      profilePictureUrl,
      accessToken,
      accessTokenExpires,
      refreshToken,
      followersCount,
      followsCount,
      mediaCount,
    } = body;

    if (!instagramUserId || !handle || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: instagramUserId, handle, accessToken' },
        { status: 400 }
      );
    }

    const cleanHandle = String(handle).startsWith('@') ? String(handle) : `@${handle}`;
    const expires = accessTokenExpires
      ? new Date(accessTokenExpires)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // default 60 days

    const feed = await prisma.socialFeed.upsert({
      where: {
        userId_platform_platformAccountId: {
          userId: user.id,
          platform: 'INSTAGRAM',
          platformAccountId: String(instagramUserId),
        },
      },
      update: {
        handle: cleanHandle,
        displayName: displayName || cleanHandle,
        profilePictureUrl: profilePictureUrl ?? undefined,
        accessToken,
        accessTokenExpires: expires,
        refreshToken: refreshToken ?? undefined,
        isConnected: true,
        lastSyncAt: new Date(),
        lastSyncError: null,
        ...(typeof followersCount === 'number' ? { followers: followersCount } : {}),
        ...(typeof followsCount === 'number' ? { following: followsCount } : {}),
        ...(typeof mediaCount === 'number' ? { postsCount: mediaCount } : {}),
      },
      create: {
        userId: user.id,
        platform: 'INSTAGRAM',
        platformAccountId: String(instagramUserId),
        handle: cleanHandle,
        displayName: displayName || cleanHandle,
        profilePictureUrl: profilePictureUrl ?? undefined,
        accessToken,
        accessTokenExpires: expires,
        refreshToken: refreshToken ?? undefined,
        isConnected: true,
        lastSyncAt: new Date(),
        followers: typeof followersCount === 'number' ? followersCount : 0,
        following: typeof followsCount === 'number' ? followsCount : 0,
        postsCount: typeof mediaCount === 'number' ? mediaCount : 0,
      },
      select: {
        id: true,
        platformAccountId: true,
        handle: true,
        displayName: true,
        profilePictureUrl: true,
        isConnected: true,
      },
    });

    return NextResponse.json({ success: true, feed });
  } catch (error: any) {
    console.error('Instagram connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect Instagram account' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/instagram/accounts/connect
 * List the current user's connected Instagram feeds from the database.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ accounts: [], count: 0 });
    }

    const feeds = await prisma.socialFeed.findMany({
      where: { userId: user.id, platform: 'INSTAGRAM' },
      select: {
        id: true,
        platformAccountId: true,
        handle: true,
        displayName: true,
        profilePictureUrl: true,
        isConnected: true,
        followers: true,
        following: true,
        postsCount: true,
        lastSyncAt: true,
        accessTokenExpires: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ accounts: feeds, count: feeds.length });
  } catch (error: any) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}
