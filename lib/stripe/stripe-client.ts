import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
      typescript: true,
      appInfo: {
        name: 'Social Exchange',
        version: '0.1.0',
        url: 'https://social-exchange-frontend.vercel.app',
      },
    });
  }
  return _stripe;
}

// Deposit limits (USD)
export const MIN_DEPOSIT_USD = 5;
export const MAX_DEPOSIT_USD = 5000;

// Platform fee on trades
export const WITHDRAWAL_FEE_PERCENT = 10;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
