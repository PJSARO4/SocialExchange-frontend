import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import * as ammService from '@/lib/market/amm-service';

/**
 * GET /api/eshares/trade?userId=...
 * Get user's trades
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (brandId) where.brandId = brandId;

    const trades = await prisma.trade.findMany({
      where,
      include: {
        brand: {
          select: {
            id: true,
            ticker: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(trades);
  } catch (error) {
    console.error('[Trade GET]', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

/**
 * POST /api/eshares/trade
 * Execute a buy or sell trade
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

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User or wallet not found' }, { status: 404 });
    }

    const body = await request.json();
    const { brandId, side, quantity, maxPrice, minPrice } = body;

    if (!brandId || !side || !quantity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create market order
    const order = await prisma.marketOrder.create({
      data: {
        walletId: user.wallet.id,
        brandId,
        side,
        orderType: 'MARKET',
        quantity: quantity,
      },
    });

    try {
      let result;

      if (side === 'BUY') {
        result = await ammService.executeBuyTrade(
          user.id,
          brandId,
          order.id,
          quantity,
          maxPrice || 999999
        );

        // Update order
        await prisma.marketOrder.update({
          where: { id: order.id },
          data: {
            status: 'FILLED',
            filledQuantity: quantity,
            averagePrice: result.newPrice,
            totalValue: result.costs.subtotal,
            tradingFee: result.costs.tradingFee,
            creatorRoyalty: result.costs.creatorRoyalty,
            filledAt: new Date(),
          },
        });

        // Update wallet
        const totalCost = result.costs.total;
        if (Number(user.wallet.balance) < totalCost) {
          throw new Error('Insufficient balance');
        }

        await prisma.wallet.update({
          where: { id: user.wallet.id },
          data: {
            balance: {
              decrement: totalCost,
            },
          },
        });

        // Record transaction
        await prisma.walletTransaction.create({
          data: {
            walletId: user.wallet.id,
            type: 'BUY_SHARES',
            amount: quantity,
            balanceBefore: user.wallet.balance,
            balanceAfter: {
              decrement: totalCost,
            },
            brandId,
            description: `Buy ${quantity} shares of ${result.shareholding.brandId}`,
          },
        });
      } else {
        result = await ammService.executeSellTrade(
          user.id,
          brandId,
          order.id,
          quantity,
          minPrice || 0
        );

        // Update order
        await prisma.marketOrder.update({
          where: { id: order.id },
          data: {
            status: 'FILLED',
            filledQuantity: quantity,
            averagePrice: result.newPrice,
            totalValue: result.proceeds.subtotal,
            tradingFee: result.proceeds.tradingFee,
            creatorRoyalty: result.proceeds.creatorRoyalty,
            filledAt: new Date(),
          },
        });

        // Update wallet
        await prisma.wallet.update({
          where: { id: user.wallet.id },
          data: {
            balance: {
              increment: result.proceeds.net,
            },
          },
        });

        // Record transaction
        await prisma.walletTransaction.create({
          data: {
            walletId: user.wallet.id,
            type: 'SELL_SHARES',
            amount: quantity,
            balanceBefore: user.wallet.balance,
            balanceAfter: {
              increment: result.proceeds.net,
            },
            brandId,
            description: `Sell ${quantity} shares of ${result.shareholding.brandId}`,
          },
        });
      }

      return NextResponse.json(result, { status: 201 });
    } catch (tradeError: any) {
      // Cancel order on error
      await prisma.marketOrder.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      throw tradeError;
    }
  } catch (error: any) {
    console.error('[Trade POST]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute trade' },
      { status: 400 }
    );
  }
}
