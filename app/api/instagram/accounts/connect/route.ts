import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/instagram/accounts/connect
 * Store OAuth token and user info in the database after successful OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      instagramUserId,
      handle,
      displayName,
      accountType,
      profilePictureUrl,
      biography,
      accessToken,
      accessTokenExpires,
      refreshToken,
      scopes = [],
    } = body;

    // Validate required fields
    if (!instagramUserId || !handle || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: instagramUserId, handle, accessToken' },
        { status: 400 }
      );
    }

    // In production, you would use Prisma here:
    // const account = await prisma.instagramAccount.upsert({
    //   where: { userId_instagramUserId: { userId: session.user.id, instagramUserId } },
    //   update: { ... },
    //   create: { ... }
    // });

    // For now, store in a mock database (localStorage bridge)
    // This will be replaced with actual Prisma calls once DB is ready
    console.log('📱 Instagram account connected:', {
      userId: session.user.id,
      instagramUserId,
      handle,
      accountType,
      tokenExpires: accessTokenExpires,
    });

    // Return the stored account data
    return NextResponse.json({
      success: true,
      account: {
        id: `ig-${instagramUserId}`,
        userId: session.user.id,
        instagramUserId,
        handle,
        displayName,
        accountType,
        profilePictureUrl,
        biography,
        scopes,
        isConnected: true,
        isPrimary: true, // Mark first connection as primary
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

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
 * Get all connected Instagram accounts for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production:
    // const accounts = await prisma.instagramAccount.findMany({
    //   where: { userId: session.user.id },
    //   select: {
    //     id, instagramUserId, handle, displayName, accountType,
    //     profilePictureUrl, isConnected, isPrimary, cachedFollowers,
    //     cachedFollowing, cachedMediaCount, lastSyncAt, createdAt
    //   }
    // });

    console.log('📱 Fetching connected accounts for user:', session.user.id);

    // Mock response
    return NextResponse.json({
      accounts: [],
      count: 0,
    });

  } catch (error: any) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
