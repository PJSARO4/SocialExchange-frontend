/**
 * Trade API Routes
 *
 * POST /api/market/trade - Execute a buy/sell order
 * GET  /api/market/trade - Get order history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeMarketOrder, getOrderHistory } from '@/lib/market/trading-service';
import { getWalletBalance } from '@/lib/market/wallet-service';
import { IS_DEMO_MODE, DEMO_DISCLAIMER } from '@/lib/market/constants';
import type { CreateOrderRequest } from '@/lib/market/types';

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
 * POST /api/market/trade
 * Execute a buy or sell order
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { brandId, side, quantity, orderType, limitPrice } = body;

    // Validate required fields
    if (!brandId) {
      return NextResponse.json(
        { error: 'brandId is required' },
        { status: 400 }
      );
    }

    if (!side || !['BUY', 'SELL'].includes(side)) {
      return NextResponse.json(
        { error: 'side must be "BUY" or "SELL"' },
        { status: 400 }
      );
    }

    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json(
        { error: 'quantity must be a positive number' },
        { status: 400 }
      );
    }

    // For now, only market orders are supported
    const request: CreateOrderRequest = {
      brandId,
      side,
      quantity,
      orderType: orderType || 'MARKET',
      limitPrice,
    };

    const result = await executeMarketOrder(userId, request);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.order,
      trade: result.trade,
      newBalance: await getWalletBalance(userId),
      demoMode: IS_DEMO_MODE,
    });
  } catch (error) {
    console.error('Trade POST error:', error);
    return NextResponse.json(
      { error: 'Trade execution failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/market/trade
 * Get order history
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
    const limit = parseInt(searchParams.get('limit') || '50');

    const orders = await getOrderHistory(userId, limit);

    return NextResponse.json({
      orders,
      demoMode: IS_DEMO_MODE,
    });
  } catch (error) {
    console.error('Trade GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
