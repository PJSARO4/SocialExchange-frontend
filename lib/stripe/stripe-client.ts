import Stripe from 'stripe';

/**
 * Server-side Stripe client for Social Exchange.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY - Stripe secret key
 *   STRIPE_WEBHOOK_SECRET - Stripe webhook signing secret
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Stripe publishable key (client-side)
 *
 * Uses lazy initialization to avoid build-time errors when env vars are not set.
 */

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

// SExCOINS conversion rate: 1 coin = $0.10 USD
export const SEXCOINS_TO_USD = 0.10;
export const USD_TO_SEXCOINS = 10; // $1 = 10 SExCOINS

// Minimum/maximum deposit amounts (in USD)
export const MIN_DEPOSIT_USD = 5;    // $5 = 50 SExCOINS
export const MAX_DEPOSIT_USD = 5000; // $5,000 = 50,000 SExCOINS

// Withdrawal fee
export const WITHDRAWAL_FEE_PERCENT = 10; // 10% fee on withdrawals

/**
 * Convert USD amount to SExCOINS
 */
export function usdToCoins(usdAmount: number): number {
  return usdAmount * USD_TO_SEXCOINS;
}

/**
 * Convert SExCOINS to USD amount
 */
export function coinsToUsd(coinAmount: number): number {
  return coinAmount * SEXCOINS_TO_USD;
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
