/**
 * SExCOINS Market System
 *
 * A social media creator stock market where:
 * - Users buy SExCOINS with USD (1 coin = $0.10)
 * - Creators can "go public" (IPO) for 1000 coins
 * - Users buy/sell shares in creators
 * - Prices move based on supply/demand
 * - 10% fee to cash out coins to USD
 * - 1% trading fee + 2% creator royalty per trade
 *
 * ⚠️ DEMO/PROTOTYPE ONLY - NOT FOR PUBLIC LAUNCH
 * This system requires legal review before handling real money.
 */

// Constants
export * from './constants';

// Types
export * from './types';

// Services
export * from './wallet-service';
export * from './trading-service';
export * from './ipo-service';
