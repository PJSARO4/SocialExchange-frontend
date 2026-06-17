import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { SEXCOIN_USD_RATE } from '@/lib/market/constants';

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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let wallet = user.wallet;

    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id },
      });
    }

    const body = await request.json();
    const { usdAmount, paymentMethod = 'demo' } = body;

    if (!usdAmount || usdAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Demo mode: always accept
    if (paymentMethod !== 'demo') {
      return NextResponse.json(
        { error: 'Only demo mode is currently supported' },
        { status: 400 }
      );
    }

    // Convert USD to coins
    const coinsReceived = usdAmount / SEXCOIN_USD_RATE;
    const balanceBefore = wallet.balance;
    const newBalance = Number(balanceBefore) + coinsReceived;

    // Update wallet
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: new Decimal(newBalance),
        totalDeposited: {
          increment: new Decimal(coinsReceived),
        },
      },
    });

    // Record transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: new Decimal(coinsReceived),
        balanceBefore,
        balanceAfter: new Decimal(newBalance),
        usdAmount: new Decimal(usdAmount),
        exchangeRate: new Decimal(SEXCOIN_USD_RATE),
        paymentProvider: paymentMethod,
        description: `Deposit ${usdAmount} USD`,
      },
    });

    return NextResponse.json(
      {
        wallet: {
          balance: Number(updatedWallet.balance),
          lockedBalance: Number(updatedWallet.lockedBalance),
        },
        transaction: {
          id: transaction.id,
          usdAmount,
          coinsReceived,
          timestamp: transaction.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Deposit POST]', error);
    return NextResponse.json({ error: 'Failed to process deposit' }, { status: 500 });
  }
}
