import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { IPO_FEE_COINS, SEXCOIN_USD_RATE } from '@/lib/market/constants';

/**
 * GET /api/eshares/ipo
 * Check IPO requirements for user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const wallet = user.wallet;
    const ipoFeeUSD = IPO_FEE_COINS * SEXCOIN_USD_RATE;
    const canLaunchIPO = wallet && Number(wallet.balance) >= IPO_FEE_COINS;

    return NextResponse.json({
      ipoFeeCoins: IPO_FEE_COINS,
      ipoFeeUSD,
      walletBalance: wallet?.balance || 0,
      canLaunchIPO,
      requirements: {
        minFollowers: 1000,
        minEngagement: 1,
      },
    });
  } catch (error) {
    console.error('[IPO GET]', error);
    return NextResponse.json({ error: 'Failed to fetch IPO requirements' }, { status: 500 });
  }
}

/**
 * POST /api/eshares/ipo
 * Launch an IPO (create brand and go public)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const body = await request.json();

    // Validate ticker
    if (!body.ticker || body.ticker.length < 2 || body.ticker.length > 10) {
      return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 });
    }

    // Check if ticker exists
    const existingBrand = await prisma.brand.findUnique({
      where: { ticker: body.ticker.toUpperCase() },
    });

    if (existingBrand) {
      return NextResponse.json({ error: 'Ticker already exists' }, { status: 400 });
    }

    // Check wallet balance
    if (Number(user.wallet.balance) < IPO_FEE_COINS) {
      return NextResponse.json(
        { error: `Insufficient balance. Need ${IPO_FEE_COINS} coins` },
        { status: 400 }
      );
    }

    // Validate data
    const sharesIssued = body.sharesIssued || 10000;
    const initialPrice = body.initialPrice || 0.1;

    // Create brand
    const brand = await prisma.brand.create({
      data: {
        ownerId: user.id,
        ticker: body.ticker.toUpperCase(),
        name: body.name || `${body.ticker} Token`,
        description: body.description,
        logoUrl: body.logoUrl,
        bannerUrl: body.bannerUrl,
        instagramHandle: body.instagramHandle,
        tiktokHandle: body.tiktokHandle,
        twitterHandle: body.twitterHandle,
        youtubeHandle: body.youtubeHandle,
        sharesIssued: new Decimal(sharesIssued),
        sharesOutstanding: new Decimal(sharesIssued * 0.8), // 80% in circulation, 20% reserved
        sharesInReserve: new Decimal(sharesIssued * 0.2),
        currentPrice: new Decimal(initialPrice),
        previousPrice: new Decimal(initialPrice),
        ipoPrice: new Decimal(initialPrice),
        marketCap: new Decimal(sharesIssued * initialPrice),
        status: 'ACTIVE',
        ipoDate: new Date(),
        allTimeHigh: new Decimal(initialPrice),
        allTimeLow: new Decimal(initialPrice),
      },
    });

    // Deduct IPO fee from wallet
    await prisma.wallet.update({
      where: { id: user.wallet.id },
      data: {
        balance: {
          decrement: new Decimal(IPO_FEE_COINS),
        },
      },
    });

    // Record transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: user.wallet.id,
        type: 'IPO_FEE',
        amount: new Decimal(IPO_FEE_COINS),
        balanceBefore: user.wallet.balance,
        balanceAfter: new Decimal(Number(user.wallet.balance) - IPO_FEE_COINS),
        usdAmount: new Decimal(IPO_FEE_COINS * SEXCOIN_USD_RATE),
        description: `IPO fee for ${brand.ticker}`,
      },
    });

    // Give owner initial shares
    await prisma.shareholding.create({
      data: {
        walletId: user.wallet.id,
        brandId: brand.id,
        quantity: new Decimal(sharesIssued * 0.2), // Creator gets 20% reserved shares
        averageCost: new Decimal(initialPrice),
        totalCost: new Decimal(sharesIssued * 0.2 * initialPrice),
      },
    });

    return NextResponse.json(brand, { status: 201 });
  } catch (error: any) {
    console.error('[IPO POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to launch IPO' }, { status: 500 });
  }
}
