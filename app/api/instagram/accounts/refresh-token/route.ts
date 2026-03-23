import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/instagram/accounts/refresh-token
 * Refresh an Instagram access token before it expires
 *
 * Instagram access tokens expire in 60 days. We should refresh them before expiry.
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

    // In production:
    // 1. Fetch the InstagramAccount from DB
    // 2. Check if it has a refreshToken
    // 3. Call Instagram API to refresh:
    //    POST https://graph.instagram.com/refresh_access_token
    //    with client_id, client_secret, and refresh_token
    // 4. Update the account with new accessToken and expiry
    // 5. Return the new token

    // For now, log the request
    console.log('🔄 Token refresh requested for account:', accountId);

    // This endpoint will need actual implementation when DB is connected
    // Placeholder response
    return NextResponse.json({
      success: true,
      message: 'Token refresh scheduled. Implement with Prisma when DB is connected.',
      accountId,
    });

  } catch (error: any) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

/**
 * CRON job route: /api/instagram/accounts/refresh-token?cron=1
 * Called periodically to refresh tokens before they expire
 * Requires CRON_SECRET env var for security
 */
export async function GET(request: NextRequest) {
  try {
    const isCron = request.nextUrl.searchParams.get('cron');
    const secret = request.nextUrl.searchParams.get('secret');

    // Verify cron secret
    if (isCron && secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Invalid cron secret' },
        { status: 401 }
      );
    }

    console.log('🔄 Token refresh cron job started...');

    // In production:
    // 1. Find all InstagramAccounts where:
    //    - autoRefreshEnabled = true
    //    - accessTokenExpires is within 7 days
    // 2. For each account, attempt to refresh the token
    // 3. Log successes and failures
    // 4. Return summary

    return NextResponse.json({
      success: true,
      message: 'Token refresh cron job completed',
      refreshed: 0,
      failed: 0,
      skipped: 0,
    });

  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
