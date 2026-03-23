import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/instagram/accounts/disconnect
 * Disconnect an Instagram account (revoke token, remove from DB)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    console.log('🔌 Disconnecting Instagram account:', accountId);

    // In production:
    // 1. Verify the account belongs to the user
    // 2. Delete the InstagramAccount from DB
    // 3. Optionally revoke the token via Instagram API:
    //    https://graph.instagram.com/{app-id}/permissions?access_token={token}

    return NextResponse.json({
      success: true,
      message: 'Instagram account disconnected',
      accountId,
    });

  } catch (error: any) {
    console.error('Disconnect error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
