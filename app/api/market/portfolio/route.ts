/**
 * Portfolio API Routes
 *
 * GET /api/market/portfolio - Get user's portfolio (holdings, P&L)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPortfolio } from '@/lib/market/trading-service';
import { getWalletBalance } from '@/lib/market/wallet-service';
import { IS_DEMO_MODE } from '@/lib/market/constants';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

const DEMO_USER_ID = 'demo-user-001';

async function getUserId(req: NextRequest): Promise<string | null> {
  if (IS_DEMO_MODE) {
    return DEMO_USER_ID;
  }
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

/**
 * GET /api/market/portfolio
 * Get user's complete portfolio with P&L
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [portfolio, wallet] = await Promise.all([
      getPortfolio(userId),
      getWalletBalance(userId),
    ]);

    // Calculate total net worth
    const totalNetWorth = portfolio.totalValue + wallet.total;

    return NextResponse.json({
      wallet,
      portfolio,
      totalNetWorth,
      demoMode: IS_DEMO_MODE,
    });
  } catch (error) {
    console.error('Portfolio GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}
