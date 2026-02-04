/**
 * SExCOINS Market System - Constants
 *
 * ⚠️ DEMO/PROTOTYPE ONLY - NOT FOR PUBLIC LAUNCH
 * This system requires legal review before handling real money.
 */

// Exchange rate: 1 SExCOIN = $0.10 USD
export const SEXCOIN_USD_RATE = 0.10;

// IPO Requirements
export const IPO_FEE_COINS = 1000;  // 1000 coins ($100) to go public
export const IPO_MIN_SHARES = 100;   // Minimum shares to issue
export const IPO_MAX_SHARES = 1000000; // Maximum shares to issue

// Fee Structure
export const WITHDRAWAL_FEE_PERCENT = 10;  // 10% fee to cash out
export const TRADING_FEE_PERCENT = 1;       // 1% platform fee per trade
export const CREATOR_ROYALTY_PERCENT = 2;   // 2% to creator per trade

// Market Maker Settings
export const MARKET_MAKER_SPREAD_PERCENT = 10;  // ±10% from market price
export const MIN_ORDER_COINS = 1;    // Minimum order size in coins
export const MAX_ORDER_COINS = 100000; // Maximum order size in coins

// Ticker Rules
export const TICKER_MIN_LENGTH = 2;
export const TICKER_MAX_LENGTH = 10;
export const TICKER_REGEX = /^[A-Z0-9]+$/;

// Price Boundaries
export const MIN_SHARE_PRICE = 0.0001;  // Minimum price per share
export const MAX_SHARE_PRICE = 1000000; // Maximum price per share

// Demo Mode
export const IS_DEMO_MODE = true;
export const DEMO_DISCLAIMER = `
⚠️ DEMO MODE - NOT REAL MONEY

This is a prototype demonstration of the SExCOINS market system.
• No real USD is being exchanged
• No real financial transactions occur
• All balances are simulated
• This is NOT a registered security or investment product

For demonstration and testing purposes only.
Legal review required before any public launch.
`;

// Helper functions
export function usdToCoins(usd: number): number {
  return usd / SEXCOIN_USD_RATE;
}

export function coinsToUsd(coins: number): number {
  return coins * SEXCOIN_USD_RATE;
}

export function coinsToUsdAfterFee(coins: number): number {
  const fee = coins * (WITHDRAWAL_FEE_PERCENT / 100);
  return (coins - fee) * SEXCOIN_USD_RATE;
}

export function calculateTradingFees(totalValue: number): {
  tradingFee: number;
  creatorRoyalty: number;
  netValue: number;
} {
  const tradingFee = totalValue * (TRADING_FEE_PERCENT / 100);
  const creatorRoyalty = totalValue * (CREATOR_ROYALTY_PERCENT / 100);
  const netValue = totalValue - tradingFee - creatorRoyalty;

  return { tradingFee, creatorRoyalty, netValue };
}

export function calculateMarketMakerPrice(
  marketPrice: number,
  side: 'BUY' | 'SELL'
): number {
  const spread = marketPrice * (MARKET_MAKER_SPREAD_PERCENT / 100);

  if (side === 'BUY') {
    // User is buying from market maker - pay 10% above market
    return marketPrice + spread;
  } else {
    // User is selling to market maker - receive 10% below market
    return marketPrice - spread;
  }
}

export function validateTicker(ticker: string): { valid: boolean; error?: string } {
  if (ticker.length < TICKER_MIN_LENGTH) {
    return { valid: false, error: `Ticker must be at least ${TICKER_MIN_LENGTH} characters` };
  }
  if (ticker.length > TICKER_MAX_LENGTH) {
    return { valid: false, error: `Ticker must be at most ${TICKER_MAX_LENGTH} characters` };
  }
  if (!TICKER_REGEX.test(ticker)) {
    return { valid: false, error: 'Ticker must contain only uppercase letters and numbers' };
  }
  return { valid: true };
}

export function formatCoins(coins: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(coins);
}

export function formatUsd(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(usd);
}

export function formatPercent(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}
