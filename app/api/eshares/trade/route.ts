import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import * as ammService from '@/lib/market/amm-service';

/**
 * GET /api/eshares/trade?brandId=...&limit=...
 * Returns recent trades, optionally filtered by brand.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const brandId = searchParams.get('brandId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const trades = await prisma.trade.findMany({
      where: brandId ? { brandId } : undefined,
      include: {
        brand: {
          select: { id: true, ticker: true, name: true },
        },
      },
      orderBy: { executedAt: 'desc' },
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
 * Execute a BUY or SELL market order.
 *
 * Body:
 *   brandId   — Brand to trade
 *   side      — 'BUY' | 'SELL'
 *   quantity  — number of shares
 *   maxPrice  — (BUY only) slippage ceiling, defaults to no limit
 *   minPrice  — (SELL only) slippage floor, defaults to 0
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
      return NextResponse.json({ error: 'Missing required fields: brandId, side, quantity' }, { status: 400 });
    }

    if (side !== 'BUY' && side !== 'SELL') {
      return NextResponse.json({ error: 'side must be BUY or SELL' }, { status: 400 });
    }

    if (quantity <= 0) {
      return NextResponse.json({ error: 'quantity must be positive' }, { status: 400 });
    }

    // Create a pending market order
    const order = await prisma.marketOrder.create({
      data: {
        walletId:  user.wallet.id,
        brandId,
        side,
        orderType: 'MARKET',
        quantity:  new Decimal(quantity),
      },
    });

    try {
      let result: Awaited<ReturnType<typeof ammService.executeBuyTrade>> |
                  Awaited<ReturnType<typeof ammService.executeSellTrade>>;

      const walletBalance = Number(user.wallet.balance);

      if (side === 'BUY') {
        result = await ammService.executeBuyTrade(
          user.id,
          brandId,
          order.id,
          quantity,
          maxPrice ?? 999_999_999
        );

        const buyResult = result as Awaited<ReturnType<typeof ammService.executeBuyTrade>>;
        const totalCost = buyResult.costs.total;

        if (walletBalance < totalCost) {
          throw new Error(
            `Insufficient balance: need ${totalCost.toFixed(2)} coins, have ${walletBalance.toFixed(2)}`
          );
        }

        // Debit wallet
        await prisma.wallet.update({
          where: { id: user.wallet.id },
          data: {
            balance:            { decrement: new Decimal(totalCost) },
            totalTradingVolume: { increment: new Decimal(buyResult.costs.subtotal) },
          },
        });

        // Ledger entry
        await prisma.walletTransaction.create({
          data: {
            walletId:     user.wallet.id,
            type:         'BUY_SHARES',
            amount:       new Decimal(totalCost),
            balanceBefore: new Decimal(walletBalance),
            balanceAfter:  new Decimal(walletBalance - totalCost),
            brandId,
            orderId:       order.id,
            description:   `Buy ${quantity} shares @ ${buyResult.newPrice.toFixed(4)} coins`,
          },
        });

        // Mark order filled
        await prisma.marketOrder.update({
          where: { id: order.id },
          data: {
            status:         'FILLED',
            filledQuantity: new Decimal(quantity),
            averagePrice:   new Decimal(buyResult.newPrice),
            totalValue:     new Decimal(buyResult.costs.subtotal),
            tradingFee:     new Decimal(buyResult.costs.tradingFee),
            creatorRoyalty: new Decimal(buyResult.costs.creatorRoyalty),
            filledAt:       new Date(),
          },
        });

        return NextResponse.json(buyResult, { status: 201 });

      } else {
        // SELL path
        result = await ammService.executeSellTrade(
          user.id,
          brandId,
          order.id,
          quantity,
          minPrice ?? 0
        );

        const sellResult = result as Awaited<ReturnType<typeof ammService.executeSellTrade>>;
        const netProceeds = sellResult.proceeds.net;

        // Credit wallet
        await prisma.wallet.update({
          where: { id: user.wallet.id },
          data: {
            balance:            { increment: new Decimal(netProceeds) },
            totalTradingVolume: { increment: new Decimal(sellResult.proceeds.subtotal) },
          },
        });

        // Ledger entry
        await prisma.walletTransaction.create({
          data: {
            walletId:     user.wallet.id,
            type:         'SELL_SHARES',
            amount:       new Decimal(netProceeds),
            balanceBefore: new Decimal(walletBalance),
            balanceAfter:  new Decimal(walletBalance + netProceeds),
            brandId,
            orderId:       order.id,
            description:   `Sell ${quantity} shares @ ${sellResult.newPrice.toFixed(4)} coins`,
          },
        });

        // Mark order filled
        await prisma.marketOrder.update({
          where: { id: order.id },
          data: {
            status:         'FILLED',
            filledQuantity: new Decimal(quantity),
            averagePrice:   new Decimal(sellResult.newPrice),
            totalValue:     new Decimal(sellResult.proceeds.subtotal),
            tradingFee:     new Decimal(sellResult.proceeds.tradingFee),
            creatorRoyalty: new Decimal(sellResult.proceeds.creatorRoyalty),
            filledAt:       new Date(),
          },
        });

        return NextResponse.json(sellResult, { status: 201 });
      }

    } catch (tradeError: unknown) {
      // Roll back the order on any failure
      await prisma.marketOrder.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', cancelReason: String(tradeError) },
      });
      throw tradeError;
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to execute trade';
    console.error('[Trade POST]', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
