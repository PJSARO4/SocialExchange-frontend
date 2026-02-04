import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/app/generated/prisma';
import {
  getConnectedInstagramAccounts,
  getAccountInsights,
  exchangeForLongLivedToken,
} from '@/app/lib/social/instagram';

const prisma = new PrismaClient();

/**
 * POST /api/feeds/instagram/connect
 *
 * After OAuth, this endpoint:
 * 1. Fetches all Instagram Business accounts connected to the user's Facebook
 * 2. Gets initial metrics for each account
 * 3. Stores the account in the database
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get the user's Facebook/Instagram account from NextAuth
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: { in: ['instagram', 'facebook'] },
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: 'No connected Meta account found. Please sign in with Instagram/Facebook first.' },
        { status: 400 }
      );
    }

    // Exchange for long-lived token if we haven't already
    let accessToken = account.access_token;
    const tokenExpiry = account.expires_at
      ? new Date(account.expires_at * 1000)
      : null;

    // If token expires in less than 30 days, refresh it
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    if (!tokenExpiry || tokenExpiry < thirtyDaysFromNow) {
      try {
        const longLived = await exchangeForLongLivedToken(
          accessToken,
          process.env.META_CLIENT_ID!,
          process.env.META_CLIENT_SECRET!
        );

        accessToken = longLived.accessToken;

        // Update the stored token
        await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token: longLived.accessToken,
            expires_at: Math.floor(Date.now() / 1000) + longLived.expiresIn,
          },
        });
      } catch (e) {
        console.warn('Could not exchange for long-lived token:', e);
        // Continue with short-lived token
      }
    }

    // Fetch all connected Instagram Business accounts
    const igAccounts = await getConnectedInstagramAccounts(accessToken);

    if (igAccounts.length === 0) {
      return NextResponse.json(
        {
          error: 'No Instagram Business accounts found. Make sure your Instagram account is connected to a Facebook Page and is a Business or Creator account.',
        },
        { status: 400 }
      );
    }

    const connectedFeeds = [];

    for (const igAccount of igAccounts) {
      // Check if this account is already connected
      const existingFeed = await prisma.socialFeed.findFirst({
        where: {
          userId,
          platform: 'INSTAGRAM',
          platformAccountId: igAccount.id,
        },
      });

      if (existingFeed) {
        // Update existing feed
        const updatedFeed = await prisma.socialFeed.update({
          where: { id: existingFeed.id },
          data: {
            accessToken,
            isConnected: true,
            lastSyncAt: new Date(),
            followers: igAccount.followersCount,
            following: igAccount.followsCount,
            postsCount: igAccount.mediaCount,
            profilePictureUrl: igAccount.profilePictureUrl,
          },
        });
        connectedFeeds.push(updatedFeed);
      } else {
        // Create new feed
        // Fetch initial insights
        let insights;
        try {
          insights = await getAccountInsights(igAccount.id, accessToken);
        } catch (e) {
          console.warn('Could not fetch insights:', e);
          insights = { engagementRate: 0 };
        }

        const newFeed = await prisma.socialFeed.create({
          data: {
            userId,
            platform: 'INSTAGRAM',
            platformAccountId: igAccount.id,
            handle: `@${igAccount.username}`,
            displayName: igAccount.name,
            profilePictureUrl: igAccount.profilePictureUrl,
            accessToken,
            accessTokenExpires: tokenExpiry,
            isConnected: true,
            lastSyncAt: new Date(),
            followers: igAccount.followersCount,
            following: igAccount.followsCount,
            postsCount: igAccount.mediaCount,
            engagementRate: insights.engagementRate,
          },
        });

        connectedFeeds.push(newFeed);
      }
    }

    // Return the connected feeds (without exposing tokens)
    const safeFeedsResponse = connectedFeeds.map((feed) => ({
      id: feed.id,
      platform: feed.platform.toLowerCase(),
      handle: feed.handle,
      displayName: feed.displayName,
      profilePictureUrl: feed.profilePictureUrl,
      isConnected: feed.isConnected,
      automationEnabled: feed.automationEnabled,
      controlMode: feed.controlMode.toLowerCase(),
      lastSync: feed.lastSyncAt?.toISOString(),
      metrics: {
        followers: feed.followers,
        following: feed.following,
        postsCount: feed.postsCount,
        engagement: feed.engagementRate,
      },
    }));

    return NextResponse.json({
      success: true,
      feeds: safeFeedsResponse,
      message: `Successfully connected ${connectedFeeds.length} Instagram account(s)`,
    });
  } catch (error) {
    console.error('POST /api/feeds/instagram/connect failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Instagram account',
      },
      { status: 500 }
    );
  }
}
