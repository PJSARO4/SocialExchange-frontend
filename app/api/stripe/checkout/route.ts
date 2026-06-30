import { NextRequest, NextResponse } from 'next/server';
import { getStripe, isStripeConfigured, MIN_DEPOSIT_USD, MAX_DEPOSIT_USD } from '@/lib/stripe/stripe-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session to deposit USD into the user's wallet.
 * Body: { amountUsd: number }
 */
export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { amountUsd } = body;

    if (!amountUsd || typeof amountUsd !== 'number') {
      return NextResponse.json({ error: 'amountUsd is required and must be a number' }, { status: 400 });
    }
    if (amountUsd < MIN_DEPOSIT_USD) {
      return NextResponse.json({ error: `Minimum deposit is $${MIN_DEPOSIT_USD}` }, { status: 400 });
    }
    if (amountUsd > MAX_DEPOSIT_USD) {
      return NextResponse.json({ error: `Maximum deposit is $${MAX_DEPOSIT_USD}` }, { status: 400 });
    }

    const amountCents = Math.round(amountUsd * 100);
    const origin =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      'https://social-exchange-frontend.vercel.app';

    const checkoutSession = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Social Exchange Wallet Deposit',
              description: `Add $${amountUsd.toFixed(2)} USD to your Social Exchange wallet`,
              images: [],
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        amountUsd: amountUsd.toString(),
        type: 'wallet_deposit',
      },
      success_url: `${origin}/cockpit/my-e-assets/my-e-shares?deposit=success&amount=${amountUsd}`,
      cancel_url: `${origin}/cockpit/my-e-assets/my-e-shares?deposit=cancelled`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
