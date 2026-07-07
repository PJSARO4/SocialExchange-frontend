import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { getStripe, isStripeConfigured, WITHDRAWAL_FEE_PERCENT } from '@/lib/stripe/stripe-client';
import { SEXCOIN_USD_RATE } from '@/lib/market/constants';

/**
 * POST /api/stripe/connect
 *
 * Handles Stripe Connect operations for seller payouts.
 *
 * Actions:
 * - action: 'create-account' - Creates a Stripe Connect Express account for a seller
 * - action: 'create-payout'  - Initiates a USD withdrawal from wallet to bank
 * - action: 'account-link'   - Gets onboarding URL for Connect account setup
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 503 }
      );
    }

    // Require a valid session. The acting userId is derived from the session,
    // never from the request body, to prevent unauthenticated money movement.
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-account': {
        return await handleCreateAccount(userId, body);
      }

      case 'account-link': {
        return await handleAccountLink(userId, body);
      }

      case 'create-payout': {
        return await handleCreatePayout(userId, body);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Stripe Connect] Error:', error);
    return NextResponse.json(
      { error: 'Stripe Connect operation failed' },
      { status: 500 }
    );
  }
}

/**
 * Create a Stripe Connect Express account for a seller.
 * This allows them to receive payouts from escrow completions.
 */
async function handleCreateAccount(userId: string, body: { email?: string; country?: string }) {
  const account = await getStripe().accounts.create({
    type: 'express',
    email: body.email,
    country: body.country || 'US',
    capabilities: {
      transfers: { requested: true },
    },
    metadata: {
      userId,
      platform: 'social-exchange',
    },
  });

  return NextResponse.json({
    accountId: account.id,
    created: true,
  });
}

/**
 * Verify that a Stripe Connect account belongs to the acting session user.
 * Ownership is asserted via the `metadata.userId` we set at account creation.
 * Returns true only when the account exists and is owned by this user.
 */
async function verifyAccountOwnership(
  userId: string,
  stripeAccountId: string
): Promise<boolean> {
  try {
    const account = await getStripe().accounts.retrieve(stripeAccountId);
    return account?.metadata?.userId === userId;
  } catch {
    return false;
  }
}

/**
 * Get a Stripe Connect onboarding link for the user to set up their payout details.
 */
async function handleAccountLink(userId: string, body: { stripeAccountId: string }) {
  if (!body.stripeAccountId) {
    return NextResponse.json(
      { error: 'stripeAccountId is required' },
      { status: 400 }
    );
  }

  // Ensure the Connect account being linked belongs to the session user.
  const owns = await verifyAccountOwnership(userId, body.stripeAccountId);
  if (!owns) {
    return NextResponse.json(
      { error: 'Stripe account does not belong to the authenticated user' },
      { status: 403 }
    );
  }

  const origin =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://social-exchange-frontend.vercel.app';

  const accountLink = await getStripe().accountLinks.create({
    account: body.stripeAccountId,
    refresh_url: `${origin}/cockpit/my-e-assets/my-e-shares?payout=refresh`,
    return_url: `${origin}/cockpit/my-e-assets/my-e-shares?payout=complete`,
    type: 'account_onboarding',
  });

  return NextResponse.json({
    url: accountLink.url,
  });
}

/**
 * Create a USD payout from wallet balance to bank via Stripe Connect.
 *
 * Flow:
 * 1. Verify user has sufficient USD wallet balance
 * 2. Deduct amount + fee from wallet
 * 3. Transfer net USD to their Stripe Connect account
 * 4. Stripe handles the actual bank payout
 */
async function handleCreatePayout(
  userId: string,
  body: { usdAmount: number; stripeAccountId: string }
) {
  const { usdAmount, stripeAccountId } = body;

  if (!usdAmount || usdAmount <= 0) {
    return NextResponse.json(
      { error: 'usdAmount must be positive' },
      { status: 400 }
    );
  }

  if (!stripeAccountId) {
    return NextResponse.json(
      { error: 'stripeAccountId is required. Set up your payout account first.' },
      { status: 400 }
    );
  }

  // Verify the destination Connect account belongs to the session user before
  // moving any money.
  const owns = await verifyAccountOwnership(userId, stripeAccountId);
  if (!owns) {
    return NextResponse.json(
      { error: 'Stripe account does not belong to the authenticated user' },
      { status: 403 }
    );
  }

  const feeUsd = usdAmount * (WITHDRAWAL_FEE_PERCENT / 100);
  const netUsd = usdAmount - feeUsd;
  const netCents = Math.round(netUsd * 100);

  if (netCents < 100) {
    return NextResponse.json(
      { error: 'Withdrawal amount too small. Minimum payout after fees is $1.00.' },
      { status: 400 }
    );
  }

  // The wallet balance is denominated in SExCOINS. Convert the gross USD amount
  // (the full amount being withdrawn, inclusive of fee) into coins to debit.
  const coinsToDebit = new Decimal(usdAmount).div(SEXCOIN_USD_RATE);

  // Atomically verify sufficient funds and debit the wallet BEFORE transferring.
  // The debit and the WalletTransaction record are performed in a single DB
  // transaction with a conditional update so a concurrent request cannot
  // double-spend the same balance.
  let debit;
  try {
    debit = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        return { ok: false as const, error: 'Wallet not found' };
      }

      const balanceBefore = wallet.balance;
      if (new Decimal(balanceBefore).lessThan(coinsToDebit)) {
        return { ok: false as const, error: 'Insufficient wallet balance' };
      }

      // Conditional decrement: only succeeds if the balance is still sufficient.
      const updateResult = await tx.wallet.updateMany({
        where: { userId, balance: { gte: coinsToDebit } },
        data: {
          balance: { decrement: coinsToDebit },
          totalWithdrawn: { increment: coinsToDebit },
        },
      });

      if (updateResult.count !== 1) {
        // Balance changed underneath us (concurrent withdrawal) — reject.
        return { ok: false as const, error: 'Insufficient wallet balance' };
      }

      const balanceAfter = new Decimal(balanceBefore).minus(coinsToDebit);

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAWAL',
          amount: coinsToDebit,
          balanceBefore,
          balanceAfter,
          usdAmount: new Decimal(usdAmount),
          exchangeRate: new Decimal(SEXCOIN_USD_RATE),
          feeAmount: new Decimal(feeUsd).div(SEXCOIN_USD_RATE),
          feePercentage: new Decimal(WITHDRAWAL_FEE_PERCENT),
          paymentProvider: 'stripe',
          description: `Withdrawal of ${usdAmount.toFixed(2)} USD via Stripe Connect`,
        },
      });

      return { ok: true as const, walletId: wallet.id };
    });
  } catch (err) {
    console.error('[Stripe Connect] Wallet debit failed:', err);
    return NextResponse.json(
      { error: 'Failed to debit wallet' },
      { status: 500 }
    );
  }

  if (!debit.ok) {
    return NextResponse.json({ error: debit.error }, { status: 400 });
  }

  // Wallet has been debited; now move the funds. If the transfer fails, refund
  // the wallet so the user is not left short.
  let transfer;
  try {
    transfer = await getStripe().transfers.create({
      amount: netCents,
      currency: 'usd',
      destination: stripeAccountId,
      metadata: {
        userId,
        usdAmount: usdAmount.toFixed(2),
        feeUsd: feeUsd.toFixed(2),
        netUsd: netUsd.toFixed(2),
        type: 'wallet_withdrawal',
      },
    });
  } catch (transferError) {
    console.error('[Stripe Connect] Transfer failed, refunding wallet:', transferError);
    try {
      await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet) return;
        const balanceBefore = wallet.balance;
        await tx.wallet.update({
          where: { userId },
          data: {
            balance: { increment: coinsToDebit },
            totalWithdrawn: { decrement: coinsToDebit },
          },
        });
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'REFUND',
            amount: coinsToDebit,
            balanceBefore,
            balanceAfter: new Decimal(balanceBefore).plus(coinsToDebit),
            usdAmount: new Decimal(usdAmount),
            exchangeRate: new Decimal(SEXCOIN_USD_RATE),
            paymentProvider: 'stripe',
            description: 'Refund: Stripe Connect transfer failed',
          },
        });
      });
    } catch (refundError) {
      console.error('[Stripe Connect] CRITICAL: refund after failed transfer failed:', refundError);
    }
    return NextResponse.json(
      { error: 'Payout transfer failed. Your wallet balance was not charged.' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    transferId: transfer.id,
    usdAmount,
    feeUsd,
    netUsd,
    feePercent: WITHDRAWAL_FEE_PERCENT,
  });
}
