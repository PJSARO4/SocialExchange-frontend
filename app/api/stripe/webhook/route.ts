import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/stripe-client';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events.
 * - checkout.session.completed: Credit USD to user's wallet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.warn(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`, paymentIntent.last_payment_error?.message);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

/**
 * Credit USD directly to user's wallet balance.
 * Wallet balance is stored as USD (1.00 = $1).
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const amountUsd = parseFloat(session.metadata?.amountUsd || '0');

  if (!userId || !amountUsd) {
    console.error('[Stripe Webhook] Missing metadata', { sessionId: session.id, metadata: session.metadata });
    return;
  }

  console.log(`[Stripe Webhook] Crediting $${amountUsd} USD to user ${userId}`);

  await prisma.$transaction(async (tx) => {
    const walletBefore = await tx.wallet.findUnique({ where: { userId } });
    const balanceBefore = walletBefore ? Number(walletBefore.balance) : 0;
    const balanceAfter = balanceBefore + amountUsd;

    const wallet = await tx.wallet.upsert({
      where: { userId },
      update: {
        balance:        { increment: new Decimal(amountUsd) },
        totalDeposited: { increment: new Decimal(amountUsd) },
      },
      create: {
        userId,
        balance:        new Decimal(amountUsd),
        totalDeposited: new Decimal(amountUsd),
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId:        wallet.id,
        type:            'DEPOSIT',
        amount:          new Decimal(amountUsd),
        balanceBefore:   new Decimal(balanceBefore),
        balanceAfter:    new Decimal(balanceAfter),
        usdAmount:       new Decimal(amountUsd),
        exchangeRate:    new Decimal(1),
        paymentProvider: 'stripe',
        paymentId:       session.id,
        paymentStatus:   'completed',
        description:     `Deposit $${amountUsd.toFixed(2)} USD`,
        metadata: {
          stripeSessionId:  session.id,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId,
        type:       'WALLET_DEPOSIT',
        title:      'Deposit Successful',
        message:    `$${amountUsd.toFixed(2)} has been added to your wallet.`,
        entityType: 'wallet',
        entityId:   wallet.id,
      },
    });
  });

  console.log(`[Stripe Webhook] ✓ Wallet credited — user=${userId} amount=$${amountUsd}`);
}
