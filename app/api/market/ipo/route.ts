/**
 * IPO API Routes
 *
 * GET  /api/market/ipo - Check eligibility, get IPO stats
 * POST /api/market/ipo - Execute IPO (go public)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  executeIPO,
  isTickerAvailable,
  validateIPORequest,
  calculateIPODetails,
  canUserGoPublic,
  getUserBrands,
  getIPOStats,
} from '@/lib/market/ipo-service';
import { getWalletBalance } from '@/lib/market/wallet-service';
import { IS_DEMO_MODE, IPO_FEE_COINS } from '@/lib/market/constants';
import type { IPORequest } from '@/lib/market/types';

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
 * GET /api/market/ipo
 * Get IPO eligibility and stats
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const ticker = searchParams.get('ticker');

    // Check ticker availability
    if (action === 'check-ticker' && ticker) {
      const available = await isTickerAvailable(ticker);
      return NextResponse.json({
        ticker: ticker.toUpperCase(),
        available,
      });
    }

    // Get IPO stats (public, no auth required)
    if (action === 'stats') {
      const stats = await getIPOStats();
      return NextResponse.json({
        stats,
        ipoFee: IPO_FEE_COINS,
        demoMode: IS_DEMO_MODE,
      });
    }

    // User-specific endpoints require auth
    const userId = await getUserId(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's eligibility
    if (action === 'eligibility') {
      const eligibility = await canUserGoPublic(userId);
      const wallet = await getWalletBalance(userId);

      return NextResponse.json({
        ...eligibility,
        walletBalance: wallet.available,
        ipoFee: IPO_FEE_COINS,
        demoMode: IS_DEMO_MODE,
      });
    }

    // Get user's brands
    if (action === 'my-brands') {
      const brands = await getUserBrands(userId);
      return NextResponse.json({
        brands,
        demoMode: IS_DEMO_MODE,
      });
    }

    // Preview IPO details
    if (action === 'preview') {
      const name = searchParams.get('name') || '';
      const shares = parseInt(searchParams.get('shares') || '1000');
      const price = parseFloat(searchParams.get('price') || '10');

      const details = calculateIPODetails({
        ticker: ticker || '',
        name,
        sharesIssued: shares,
        initialPrice: price,
      });

      const validation = validateIPORequest({
        ticker: ticker || '',
        name,
        sharesIssued: shares,
        initialPrice: price,
      });

      return NextResponse.json({
        ticker: ticker?.toUpperCase(),
        details,
        validation,
        demoMode: IS_DEMO_MODE,
      });
    }

    // Default: return eligibility + stats
    const [eligibility, stats, wallet, userBrands] = await Promise.all([
      canUserGoPublic(userId),
      getIPOStats(),
      getWalletBalance(userId),
      getUserBrands(userId),
    ]);

    return NextResponse.json({
      eligibility,
      stats,
      walletBalance: wallet.available,
      myBrands: userBrands,
      ipoFee: IPO_FEE_COINS,
      demoMode: IS_DEMO_MODE,
    });
  } catch (error) {
    console.error('IPO GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch IPO data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/market/ipo
 * Execute an IPO - Go public
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
    const {
      ticker,
      name,
      description,
      logoUrl,
      bannerUrl,
      instagramHandle,
      tiktokHandle,
      twitterHandle,
      youtubeHandle,
      sharesIssued,
      initialPrice,
    } = body;

    // Validate required fields
    if (!ticker || !name || !sharesIssued || !initialPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: ticker, name, sharesIssued, initialPrice' },
        { status: 400 }
      );
    }

    const request: IPORequest = {
      ticker,
      name,
      description,
      logoUrl,
      bannerUrl,
      instagramHandle,
      tiktokHandle,
      twitterHandle,
      youtubeHandle,
      sharesIssued: Number(sharesIssued),
      initialPrice: Number(initialPrice),
    };

    // Validate first
    const validation = validateIPORequest(request);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join('. ') },
        { status: 400 }
      );
    }

    // Check eligibility
    const eligibility = await canUserGoPublic(userId);
    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason || 'Not eligible to go public' },
        { status: 400 }
      );
    }

    // Execute IPO
    const result = await executeIPO(userId, request);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      brand: result.brand,
      transactionId: result.transactionId,
      newBalance: await getWalletBalance(userId),
      message: `Congratulations! $${result.brand?.ticker} is now live on the trading floor!`,
      demoMode: IS_DEMO_MODE,
    });
  } catch (error) {
    console.error('IPO POST error:', error);
    return NextResponse.json(
      { error: 'IPO execution failed' },
      { status: 500 }
    );
  }
}
