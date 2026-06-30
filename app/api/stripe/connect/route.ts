import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured, WITHDRAWAL_FEE_PERCENT } from '@/lib/stripe/stripe-client';

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

    const body = await request.json();
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create-account': {
        return await handleCreateAccount(userId, body);
      }

      case 'account-link': {
        return await handleAccountLink(body);
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
 * Get a Stripe Connect onboarding link for the user to set up their payout details.
 */
async function handleAccountLink(body: { stripeAccountId: string }) {
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

  const feeUsd = usdAmount * (WITHDRAWAL_FEE_PERCENT / 100);
  const netUsd = usdAmount - feeUsd;
  const netCents = Math.round(netUsd * 100);

  if (netCents < 100) {
    return NextResponse.json(
      { error: 'Withdrawal amount too small. Minimum payout after fees is $1.00.' },
      { status: 400 }
    );
  }

  // TODO: Deduct from wallet balance before transferring
  // 1. Check user's wallet balance >= usdAmount
  // 2. Check KYC status is APPROVED
  // 3. Deduct usdAmount from wallet in a transaction
  // 4. Create WalletTransaction(type: WITHDRAWAL)

  const transfer = await getStripe().transfers.create({
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

  return NextResponse.json({
    transferId: transfer.id,
    usdAmount,
    feeUsd,
    netUsd,
    feePercent: WITHDRAWAL_FEE_PERCENT,
  });
}
