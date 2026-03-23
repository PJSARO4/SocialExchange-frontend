import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

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

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'User or wallet not found' }, { status: 404 });
    }

    // Get holdings
    const shareholdings = await prisma.shareholding.findMany({
      where: { walletId: user.wallet.id },
      include: {
        brand: {
          select: {
            id: true,
            ticker: true,
            name: true,
            currentPrice: true,
          },
        },
      },
    });

    // Calculate portfolio metrics
    let totalValue = 0;
    let totalCost = 0;

    const holdings = shareholdings.map((sh) => {
      const currentValue = Number(sh.quantity) * Number(sh.brand.currentPrice);
      const cost = Number(sh.totalCost);
      const profitLoss = currentValue - cost;
      const profitLossPercent = cost > 0 ? (profitLoss / cost) * 100 : 0;

      totalValue += currentValue;
      totalCost += cost;

      return {
        id: sh.id,
        brandId: sh.brandId,
        ticker: sh.brand.ticker,
        name: sh.brand.name,
        quantity: Number(sh.quantity),
        averageCost: Number(sh.averageCost),
        currentPrice: Number(sh.brand.currentPrice),
        currentValue,
        cost,
        profitLoss,
        profitLossPercent,
      };
    });

    const totalProfitLoss = totalValue - totalCost;
    const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

    return NextResponse.json({
      wallet: {
        balance: Number(user.wallet.balance),
        lockedBalance: Number(user.wallet.lockedBalance),
      },
      portfolio: {
        totalValue,
        totalCost,
        totalProfitLoss,
        totalProfitLossPercent,
        holdings,
      },
    });
  } catch (error) {
    console.error('[Portfolio GET]', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}
