/**
 * SExCOINS IPO Service
 *
 * Handles creator "going public":
 * - Validates ticker availability
 * - Collects 1000 coin IPO fee
 * - Creates brand listing
 * - Issues initial shares
 *
 * ⚠️ DEMO MODE - Uses simulated data
 */

import {
  IPO_FEE_COINS,
  IPO_MIN_SHARES,
  IPO_MAX_SHARES,
  MIN_SHARE_PRICE,
  MAX_SHARE_PRICE,
  validateTicker,
  IS_DEMO_MODE,
} from './constants';
import { deductIPOFee, getOrCreateWallet } from './wallet-service';
import type { Brand, IPORequest, IPOResult, BrandListItem } from './types';
import { logger } from '@/lib/logging/activity-logger';

// In-memory store for demo mode (shared with trading-service)
// In production, this would use Prisma
const demoBrands = new Map<string, Brand>();

/**
 * Check if a ticker is available
 */
export async function isTickerAvailable(ticker: string): Promise<boolean> {
  const normalized = ticker.toUpperCase().trim();

  // Check validation
  const validation = validateTicker(normalized);
  if (!validation.valid) {
    return false;
  }

  // Check if already taken
  for (const brand of demoBrands.values()) {
    if (brand.ticker === normalized) {
      return false;
    }
  }

  // Reserved tickers
  const reserved = ['SEXCOIN', 'ADMIN', 'TEST', 'DEMO', 'NULL', 'UNDEFINED'];
  if (reserved.includes(normalized)) {
    return false;
  }

  return true;
}

/**
 * Validate IPO request
 */
export function validateIPORequest(request: IPORequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate ticker
  const tickerValidation = validateTicker(request.ticker);
  if (!tickerValidation.valid) {
    errors.push(tickerValidation.error!);
  }

  // Validate name
  if (!request.name || request.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (request.name && request.name.length > 50) {
    errors.push('Name must be 50 characters or less');
  }

  // Validate shares
  if (request.sharesIssued < IPO_MIN_SHARES) {
    errors.push(`Must issue at least ${IPO_MIN_SHARES} shares`);
  }
  if (request.sharesIssued > IPO_MAX_SHARES) {
    errors.push(`Cannot issue more than ${IPO_MAX_SHARES} shares`);
  }

  // Validate initial price
  if (request.initialPrice < MIN_SHARE_PRICE) {
    errors.push(`Minimum share price is ${MIN_SHARE_PRICE} coins`);
  }
  if (request.initialPrice > MAX_SHARE_PRICE) {
    errors.push(`Maximum share price is ${MAX_SHARE_PRICE} coins`);
  }

  // Validate description
  if (request.description && request.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate IPO details
 */
export function calculateIPODetails(request: IPORequest): {
  ipoFee: number;
  marketCap: number;
  yourShares: number;
  publicShares: number;
} {
  const marketCap = request.sharesIssued * request.initialPrice;

  // Creator keeps 20% of shares, 80% go to market
  const creatorSharePercent = 0.2;
  const yourShares = Math.floor(request.sharesIssued * creatorSharePercent);
  const publicShares = request.sharesIssued - yourShares;

  return {
    ipoFee: IPO_FEE_COINS,
    marketCap,
    yourShares,
    publicShares,
  };
}

/**
 * Execute an IPO - Creator goes public
 */
export async function executeIPO(
  userId: string,
  request: IPORequest
): Promise<IPOResult> {
  // Validate request
  const validation = validateIPORequest(request);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.join('. '),
    };
  }

  // Check ticker availability
  const tickerNormalized = request.ticker.toUpperCase().trim();
  const available = await isTickerAvailable(tickerNormalized);
  if (!available) {
    return {
      success: false,
      error: `Ticker $${tickerNormalized} is already taken or reserved`,
    };
  }

  // Check wallet balance
  const wallet = await getOrCreateWallet(userId);
  if (wallet.available < IPO_FEE_COINS) {
    return {
      success: false,
      error: `Insufficient balance. IPO requires ${IPO_FEE_COINS} coins, you have ${wallet.available.toFixed(2)}`,
    };
  }

  // Deduct IPO fee
  const feeTransaction = await deductIPOFee(userId);
  if (!feeTransaction) {
    return {
      success: false,
      error: 'Failed to process IPO fee',
    };
  }

  // Calculate share distribution
  const details = calculateIPODetails(request);

  // Create brand
  const brandId = `brand-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const brand: Brand = {
    id: brandId,
    ticker: tickerNormalized,
    name: request.name.trim(),
    description: request.description?.trim(),
    logoUrl: request.logoUrl,
    bannerUrl: request.bannerUrl,
    ownerId: userId,

    instagramHandle: request.instagramHandle,
    tiktokHandle: request.tiktokHandle,
    twitterHandle: request.twitterHandle,
    youtubeHandle: request.youtubeHandle,

    sharesIssued: request.sharesIssued,
    sharesOutstanding: details.publicShares, // Shares available to trade

    currentPrice: request.initialPrice,
    previousPrice: request.initialPrice,
    ipoPrice: request.initialPrice,

    marketCap: details.marketCap,
    volume24h: 0,
    priceChange24h: 0,
    allTimeHigh: request.initialPrice,
    allTimeLow: request.initialPrice,

    status: 'ACTIVE',
    ipoDate: new Date(),
  };

  // Store brand
  demoBrands.set(brandId, brand);

  // Give creator their shares (20%)
  // This would normally go through the shareholding system
  // For demo, we'll handle this in the trading service

  // Log the IPO
  logger.market.ipo(userId, 'Demo User', tickerNormalized, request.initialPrice, request.sharesIssued);

  return {
    success: true,
    brand,
    transactionId: feeTransaction.id,
  };
}

/**
 * Get brands owned by a user
 */
export async function getUserBrands(userId: string): Promise<BrandListItem[]> {
  const userBrands: BrandListItem[] = [];

  for (const brand of demoBrands.values()) {
    if (brand.ownerId === userId) {
      userBrands.push({
        id: brand.id,
        ticker: brand.ticker,
        name: brand.name,
        logoUrl: brand.logoUrl,
        currentPrice: brand.currentPrice,
        priceChange24h: brand.priceChange24h,
        marketCap: brand.marketCap,
        volume24h: brand.volume24h,
      });
    }
  }

  return userBrands;
}

/**
 * Check if user can go public (has connected social account with enough followers)
 */
export async function canUserGoPublic(userId: string): Promise<{
  eligible: boolean;
  reason?: string;
  requirements: {
    hasWallet: boolean;
    hasSufficientBalance: boolean;
    hasConnectedSocial: boolean;
    minimumFollowers: number;
    currentFollowers?: number;
  };
}> {
  const wallet = await getOrCreateWallet(userId);

  // In demo mode, everyone is eligible
  if (IS_DEMO_MODE) {
    return {
      eligible: true,
      requirements: {
        hasWallet: true,
        hasSufficientBalance: wallet.available >= IPO_FEE_COINS,
        hasConnectedSocial: true, // Demo assumes connected
        minimumFollowers: 1000,
        currentFollowers: 1500, // Demo value
      },
    };
  }

  // Production checks would include:
  // 1. Verify connected social accounts
  // 2. Check follower minimums
  // 3. Verify identity
  // etc.

  return {
    eligible: false,
    reason: 'Production eligibility checks not implemented',
    requirements: {
      hasWallet: true,
      hasSufficientBalance: wallet.available >= IPO_FEE_COINS,
      hasConnectedSocial: false,
      minimumFollowers: 1000,
    },
  };
}

/**
 * Get IPO statistics
 */
export async function getIPOStats(): Promise<{
  totalBrands: number;
  totalIPOsThisMonth: number;
  averageIPOPrice: number;
  highestMarketCap: BrandListItem | null;
}> {
  const brands = Array.from(demoBrands.values());
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const thisMonthIPOs = brands.filter(b => b.ipoDate >= monthAgo);

  const avgPrice = brands.length > 0
    ? brands.reduce((sum, b) => sum + b.ipoPrice, 0) / brands.length
    : 0;

  const highestMC = brands.reduce<Brand | null>((max, b) =>
    !max || b.marketCap > max.marketCap ? b : max, null);

  return {
    totalBrands: brands.length,
    totalIPOsThisMonth: thisMonthIPOs.length,
    averageIPOPrice: avgPrice,
    highestMarketCap: highestMC ? {
      id: highestMC.id,
      ticker: highestMC.ticker,
      name: highestMC.name,
      logoUrl: highestMC.logoUrl,
      currentPrice: highestMC.currentPrice,
      priceChange24h: highestMC.priceChange24h,
      marketCap: highestMC.marketCap,
      volume24h: highestMC.volume24h,
    } : null,
  };
}
