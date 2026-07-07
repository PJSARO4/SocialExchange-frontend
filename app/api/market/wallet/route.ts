/**
 * Wallet API Routes
 *
 * GET  /api/market/wallet - Get wallet balance
 * POST /api/market/wallet - Deposit or withdraw
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getWalletBalance,
  depositFunds,
  withdrawFunds,
  getTransactionHistory,
} from '@/lib/market/wallet-service';
import { DEMO_DISCLAIMER, IS_DEMO_MODE } from '@/lib/market/constants';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

// Demo user ID for testing without auth
const DEMO_USER_ID = 'demo-user-001';

// The hardcoded demo user may only be used for unauthenticated access OUTSIDE
// of production. In production, a real authenticated session is always required.
const ALLOW_DEMO_USER = IS_DEMO_MODE && process.env.NODE_ENV !== 'production';

/**
 * Resolve the acting user id.
 *
 * A valid session always takes precedence and the id is derived from it.
 * The unauthenticated demo-user fallback is only available outside production
 * (and only when demo mode is on) so that anonymous callers can never mutate
 * a shared wallet in production.
 */
async function getUserId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return session.user.id;
  }

  if (ALLOW_DEMO_USER) {
    return DEMO_USER_ID;
  }

  return null;
}

/**
 * Resolve the acting user id for balance-mutating operations
 * (deposit / withdraw). These ALWAYS require a real authenticated session —
 * the hardcoded demo user is never allowed to move money.
 */
async function getMutatingUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

/**
 * GET /api/market/wallet
 * Get wallet balance and transaction history
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

    const { searchParams } = new URL(req.url);
    const includeHistory = searchParams.get('history') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const balance = await getWalletBalance(userId);

    const response: Record<string, unknown> = {
      balance,
      demoMode: IS_DEMO_MODE,
    };

    if (IS_DEMO_MODE) {
      response.disclaimer = DEMO_DISCLAIMER;
    }

    if (includeHistory) {
      response.transactions = await getTransactionHistory(userId, limit);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Wallet GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/market/wallet
 * Deposit or withdraw funds
 */
export async function POST(req: NextRequest) {
  try {
    // Balance-mutating operations always require a real authenticated session.
    // The demo user fallback is intentionally NOT used here.
    const userId = await getMutatingUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, amount, method } = body;

    if (!action || !['deposit', 'withdraw'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "deposit" or "withdraw"' },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (action === 'deposit') {
      const result = await depositFunds(userId, {
        usdAmount: amount,
        paymentMethod: method || 'demo',
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        coinsReceived: result.coinsReceived,
        transactionId: result.transactionId,
        newBalance: await getWalletBalance(userId),
        demoMode: IS_DEMO_MODE,
      });
    } else {
      // Withdraw
      const result = await withdrawFunds(userId, {
        coinAmount: amount,
        payoutMethod: method || 'demo',
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        usdReceived: result.usdReceived,
        feeAmount: result.feeAmount,
        transactionId: result.transactionId,
        newBalance: await getWalletBalance(userId),
        demoMode: IS_DEMO_MODE,
      });
    }
  } catch (error) {
    console.error('Wallet POST error:', error);
    return NextResponse.json(
      { error: 'Transaction failed' },
      { status: 500 }
    );
  }
}
