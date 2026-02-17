import { NextRequest, NextResponse } from 'next/server';
import { getStripe, usdToCoins } from '@/lib/stripe/stripe-client';
import Stripe from 'stripe';

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events:
 * - checkout.session.completed: Credit SExCOINS to user's wallet
 * - payment_intent.payment_failed: Log failure
 *
 * IMPORTANT: This route must receive the raw body for signature verification.
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
        // Unhandled event type
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
 * Handle successful checkout - credit SExCOINS to user wallet.
 *
 * In production, this will:
 * 1. Look up the user by metadata.userId
 * 2. Credit metadata.coinsToReceive to their Wallet
 * 3. Create a WalletTransaction record
 * 4. Send a notification
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
    `[Stripe Webhook] Checkout completed: userId=${userId}, coins=${coinsToReceive}, usd=${amountUsd}`
  );

  // TODO: When database is connected, implement:
  // 1. prisma.wallet.upsert({ where: { userId }, update: { balance: { increment: coinsToReceive } }, create: { userId, balance: coinsToReceive } })
  // 2. prisma.walletTransaction.create({ data: { walletId, type: 'DEPOSIT', amount: coinsToReceive, usdAmount: amountUsd, ... } })
  // 3. prisma.notification.create({ data: { userId, type: 'WALLET_DEPOSIT', title: 'Deposit Successful', message: `${coinsToReceive} SExCOINS deposited` } })

  // For now, log the successful deposit
  console.log(
    `[Stripe Webhook] Would credit ${coinsToReceive} SExCOINS to user ${userId} for $${amountUsd}`
  );
}
