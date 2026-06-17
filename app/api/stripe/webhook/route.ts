import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/stripe-client';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events:
 * - checkout.session.completed: Credit SExCOINS to user's wallet
 * - payment_intent.payment_failed: Log failure
 *
 * IMPORTANT: Stripe requires the raw body for signature verification.
 * Next.js App Router passes raw bytes to request.text(), so this works correctly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.warn(
          `[Stripe Webhook] Payment failed: ${paymentIntent.id}`,
          paymentIntent.last_payment_error?.message
        );
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout — credit SExCOINS to user's wallet atomically.
 *
 * Expects session.metadata:
 *   userId        — the platform user ID
 *   coinsToReceive — SExCOINS to credit (stringified number)
 *   amountUsd      — USD paid (stringified number)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const coinsToReceive = parseFloat(session.metadata?.coinsToReceive || '0');
  const amountUsd = parseFloat(session.metadata?.amountUsd || '0');

  if (!userId || !coinsToReceive) {
    console.error('[Stripe Webhook] Missing metadata in checkout session', {
      sessionId: session.id,
      metadata: session.metadata,
    });
    return;
  }

  console.log(
    `[Stripe Webhook] Crediting ${coinsToReceive} SExCOINS to user ${userId} ($${amountUsd})`
  );

  // Run as a DB transaction so wallet + ledger stay in sync
  await prisma.$transaction(async (tx) => {
    // 1. Upsert wallet (create if first deposit)
    const walletBefore = await tx.wallet.findUnique({ where: { userId } });
    const balanceBefore = walletBefore ? Number(walletBefore.balance) : 0;

    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: {
        balance:        { increment: new Decimal(coinsToReceive) },
        totalDeposited: { increment: new Decimal(coinsToReceive) },
      },
      create: {
        userId,
        balance:        new Decimal(coinsToReceive),
        totalDeposited: new Decimal(coinsToReceive),
      },
    });

    const balanceAfter = balanceBefore + coinsToReceive;

    // 2. Record wallet transaction ledger entry
    await tx.walletTransaction.create({
      data: {
        walletId:        wallet.id,
        type:            'DEPOSIT',
        amount:          new Decimal(coinsToReceive),
        balanceBefore:   new Decimal(balanceBefore),
        balanceAfter:    new Decimal(balanceAfter),
        usdAmount:       new Decimal(amountUsd),
        exchangeRate:    new Decimal(0.10),          // $0.10 per coin
        paymentProvider: 'stripe',
        paymentId:       session.id,
        paymentStatus:   'completed',
        description:     `Deposit $${amountUsd.toFixed(2)} → ${coinsToReceive} SExCOINS`,
        metadata:        {
          stripeSessionId:  session.id,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
        },
      },
    });

    // 3. Push in-app notification
    await tx.notification.create({
      data: {
        userId,
        type:      'WALLET_DEPOSIT',
        title:     'Deposit Successful',
        message:   `${coinsToReceive.toLocaleString()} SExCOINS have been added to your wallet.`,
        entityType: 'wallet',
        entityId:   wallet.id,
      },
    });
  });

  console.log(
    `[Stripe Webhook] ✓ Wallet credited — user=${userId} coins=${coinsToReceive} usd=${amountUsd}`
  );
}
