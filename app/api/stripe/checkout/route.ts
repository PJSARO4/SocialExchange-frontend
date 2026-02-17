import { NextRequest, NextResponse } from 'next/server';
import {
  getStripe,
  isStripeConfigured,
  MIN_DEPOSIT_USD,
  MAX_DEPOSIT_USD,
  usdToCoins,
} from '@/lib/stripe/stripe-client';

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for depositing SExCOINS.
 *
 * Body: { amountUsd: number, userId: string }
 * Returns: { sessionId: string, url: string }
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
    const { amountUsd, userId } = body;

    // Validation
    if (!amountUsd || typeof amountUsd !== 'number') {
      return NextResponse.json(
        { error: 'amountUsd is required and must be a number' },
        { status: 400 }
      );
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (amountUsd < MIN_DEPOSIT_USD) {
      return NextResponse.json(
        { error: `Minimum deposit is $${MIN_DEPOSIT_USD}` },
        { status: 400 }
      );
    }

    if (amountUsd > MAX_DEPOSIT_USD) {
      return NextResponse.json(
        { error: `Maximum deposit is $${MAX_DEPOSIT_USD}` },
        { status: 400 }
      );
    }

    const coinsToReceive = usdToCoins(amountUsd);
    const amountCents = Math.round(amountUsd * 100);

    // Determine base URL for redirects
    const origin =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'https://social-exchange-frontend.vercel.app';

    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${coinsToReceive.toLocaleString()} SExCOINS`,
              description: `Deposit $${amountUsd.toFixed(2)} USD to receive ${coinsToReceive.toLocaleString()} SExCOINS at $0.10/coin`,
              images: [],
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        coinsToReceive: coinsToReceive.toString(),
        amountUsd: amountUsd.toString(),
        type: 'sexcoins_deposit',
      },
      success_url: `${origin}/cockpit/my-e-assets/my-e-shares?deposit=success&coins=${coinsToReceive}`,
      cancel_url: `${origin}/cockpit/my-e-assets/my-e-shares?deposit=cancelled`,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
