'use client';

/**
 * ============================================================
 *  E-SHARES API SERVICE
 *  Deep Space Bridge Layer :: localStorage <-> /api/market/*
 * ============================================================
 *
 * This module provides a dual-path data layer for the E-Shares
 * trading system. When USE_API is false (demo mode), every call
 * routes through the existing localStorage functions from
 * e-shares-store.ts.  When USE_API is true, calls are forwarded
 * to the Next.js API routes that hit the real database.
 *
 * Toggle USE_API to `true` once the DB-backed services are live.
 * ============================================================
 */

import type {
  BrandListing,
  ShareHolding,
  EShareTransaction,
  MarketStats,
  TransparencyAgreement,
} from '../types/e-shares';

import type { Wallet } from './wallet-store';

// ── Re-export every function from the localStorage store ────
// Consumers can still import directly if they only want local.
export {
  getBrandListings,
  getBrandById,
  getPublicBrands,
  getMyBrands,
  saveBrandListing,
  createBrandListing,
  goPublic,
  getShareHoldings,
  getMyHoldings,
  getHoldingsByBrand,
  getUserHoldingForBrand,
  saveShareHolding,
  getTransactions,
  getTransactionsByBrand,
  getTransactionsByUser,
  logEShareTransaction,
  buyShares,
  sellShares,
  getTransparencyAgreements,
  getAgreementForBrand,
  signTransparencyAgreement,
  getMarketStats,
  getPlatformFeesCollected,
  applyMicroFluctuation,
  seedESharesMarketIfEmpty,
} from './e-shares-store';

// Re-export wallet functions for convenience
export {
  getWallet,
  deposit,
  withdraw,
  deductForPurchase,
  creditFromSale,
} from './wallet-store';

// ── Local imports (needed inside wrapper bodies) ────────────
import {
  getBrandListings as localGetBrandListings,
  getBrandById as localGetBrandById,
  getPublicBrands as localGetPublicBrands,
  getMyBrands as localGetMyBrands,
  createBrandListing as localCreateBrandListing,
  goPublic as localGoPublic,
  getMyHoldings as localGetMyHoldings,
  getMarketStats as localGetMarketStats,
  buyShares as localBuyShares,
  sellShares as localSellShares,
  seedESharesMarketIfEmpty as localSeedMarket,
  signTransparencyAgreement as localSignAgreement,
  getTransactionsByBrand as localGetTransactionsByBrand,
  getTransactionsByUser as localGetTransactionsByUser,
  getHoldingsByBrand as localGetHoldingsByBrand,
  getUserHoldingForBrand as localGetUserHoldingForBrand,
} from './e-shares-store';

import {
  getWallet as localGetWallet,
  deposit as localDeposit,
  withdraw as localWithdraw,
} from './wallet-store';

// ============================================================
//  FEATURE FLAG
//  Set to `true` when the database-backed API routes are live.
// ============================================================

export const USE_API = false;

// ============================================================
//  SHARED TYPES FOR API RESPONSES
// ============================================================

/** Standardised envelope returned by every api* function. */
interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Shape returned by POST /api/market/trade */
interface TradeApiResponse {
  success: boolean;
  order?: Record<string, unknown>;
  trade?: Record<string, unknown>;
  newBalance?: Record<string, unknown>;
  error?: string;
  demoMode?: boolean;
}

/** Shape returned by GET /api/market/wallet */
interface WalletApiResponse {
  balance: {
    total: number;
    available: number;
    locked: number;
  };
  transactions?: Array<Record<string, unknown>>;
  demoMode?: boolean;
  disclaimer?: string;
  error?: string;
}

/** Shape returned by POST /api/market/wallet */
interface WalletActionApiResponse {
  success: boolean;
  coinsReceived?: number;
  usdReceived?: number;
  feeAmount?: number;
  transactionId?: string;
  newBalance?: {
    total: number;
    available: number;
    locked: number;
  };
  error?: string;
  demoMode?: boolean;
}

/** Shape returned by GET /api/market/portfolio */
interface PortfolioApiResponse {
  wallet: {
    total: number;
    available: number;
    locked: number;
  };
  portfolio: {
    holdings: Array<Record<string, unknown>>;
    totalValue: number;
    totalInvested: number;
    totalGain: number;
    totalGainPercent: number;
  };
  totalNetWorth: number;
  demoMode?: boolean;
  error?: string;
}

/** Shape returned by GET /api/market/brands */
interface BrandsApiResponse {
  brands: Array<Record<string, unknown>>;
  brand?: Record<string, unknown>;
  total?: number;
  demoMode?: boolean;
  error?: string;
}

// ============================================================
//  HELPER: Safe fetch wrapper
//  Every API call runs through this to guarantee consistent
//  error handling and JSON parsing.
// ============================================================

async function safeFetch<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: json?.error || `Request failed with status ${res.status}`,
      };
    }

    return { success: true, data: json as T };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Network request failed';
    console.error(`[e-shares-api] fetch error for ${url}:`, message);
    return { success: false, error: message };
  }
}

// ============================================================
//  API-BACKED FUNCTIONS
//  Each mirrors a localStorage function but talks to the
//  /api/market/* endpoints instead.
// ============================================================

// ── Trade Operations ────────────────────────────────────────

export async function apiBuyShares(params: {
  brandId: string;
  quantity: number;
  buyerId?: string;
  buyerName?: string;
}): Promise<{
  success: boolean;
  transaction?: EShareTransaction;
  error?: string;
}> {
  const result = await safeFetch<TradeApiResponse>('/api/market/trade', {
    method: 'POST',
    body: JSON.stringify({
      brandId: params.brandId,
      side: 'BUY',
      quantity: params.quantity,
    }),
  });

  if (!result.success || !result.data?.success) {
    return {
      success: false,
      error: result.error || result.data?.error || 'Buy order failed',
    };
  }

  // Map API response back to the EShareTransaction shape the UI expects
  const trade = result.data.trade as Record<string, unknown> | undefined;
  const transaction: EShareTransaction | undefined = trade
    ? {
        id: (trade.id as string) || crypto.randomUUID(),
        timestamp: (trade.timestamp as number) || Date.now(),
        type: 'BUY',
        brandId: params.brandId,
        brandName: (trade.brandName as string) || '',
        toUserId: params.buyerId,
        shares: params.quantity,
        pricePerShare: (trade.pricePerShare as number) || 0,
        totalAmount: (trade.totalAmount as number) || 0,
        platformFee: (trade.platformFee as number) || 0,
        netAmount: (trade.netAmount as number) || 0,
        status: 'COMPLETED',
      }
    : undefined;

  return { success: true, transaction };
}

export async function apiSellShares(params: {
  brandId: string;
  quantity: number;
  sellerId?: string;
}): Promise<{
  success: boolean;
  transaction?: EShareTransaction;
  error?: string;
}> {
  const result = await safeFetch<TradeApiResponse>('/api/market/trade', {
    method: 'POST',
    body: JSON.stringify({
      brandId: params.brandId,
      side: 'SELL',
      quantity: params.quantity,
    }),
  });

  if (!result.success || !result.data?.success) {
    return {
      success: false,
      error: result.error || result.data?.error || 'Sell order failed',
    };
  }

  const trade = result.data.trade as Record<string, unknown> | undefined;
  const transaction: EShareTransaction | undefined = trade
    ? {
        id: (trade.id as string) || crypto.randomUUID(),
        timestamp: (trade.timestamp as number) || Date.now(),
        type: 'SELL',
        brandId: params.brandId,
        brandName: (trade.brandName as string) || '',
        fromUserId: params.sellerId,
        shares: params.quantity,
        pricePerShare: (trade.pricePerShare as number) || 0,
        totalAmount: (trade.totalAmount as number) || 0,
        platformFee: (trade.platformFee as number) || 0,
        netAmount: (trade.netAmount as number) || 0,
        status: 'COMPLETED',
      }
    : undefined;

  return { success: true, transaction };
}

// ── Wallet Operations ───────────────────────────────────────

export async function apiGetWalletBalance(): Promise<
  ApiResult<{ total: number; available: number; locked: number }>
> {
  return safeFetch<{ total: number; available: number; locked: number }>(
    '/api/market/wallet'
  ).then((res) => {
    if (res.success && res.data) {
      // The wallet route nests balance inside a `balance` key
      const raw = res.data as unknown as WalletApiResponse;
      return {
        success: true,
        data: raw.balance ?? { total: 0, available: 0, locked: 0 },
      };
    }
    return res;
  });
}

export async function apiDepositFunds(
  amount: number
): Promise<ApiResult<WalletActionApiResponse>> {
  return safeFetch<WalletActionApiResponse>('/api/market/wallet', {
    method: 'POST',
    body: JSON.stringify({ action: 'deposit', amount }),
  });
}

export async function apiWithdrawFunds(
  amount: number
): Promise<ApiResult<WalletActionApiResponse>> {
  return safeFetch<WalletActionApiResponse>('/api/market/wallet', {
    method: 'POST',
    body: JSON.stringify({ action: 'withdraw', amount }),
  });
}

// ── Portfolio ───────────────────────────────────────────────

export async function apiGetPortfolio(): Promise<
  ApiResult<PortfolioApiResponse>
> {
  return safeFetch<PortfolioApiResponse>('/api/market/portfolio');
}

// ── Brands ──────────────────────────────────────────────────

export async function apiGetBrands(options?: {
  sort?: 'marketCap' | 'price' | 'change' | 'volume';
  order?: 'asc' | 'desc';
  limit?: number;
}): Promise<ApiResult<BrandsApiResponse>> {
  const params = new URLSearchParams();
  if (options?.sort) params.set('sort', options.sort);
  if (options?.order) params.set('order', options.order);
  if (options?.limit) params.set('limit', String(options.limit));

  const qs = params.toString();
  const url = `/api/market/brands${qs ? `?${qs}` : ''}`;
  return safeFetch<BrandsApiResponse>(url);
}

export async function apiGetBrandById(
  brandId: string
): Promise<ApiResult<{ brand: Record<string, unknown> }>> {
  return safeFetch<{ brand: Record<string, unknown> }>(
    `/api/market/brands?id=${encodeURIComponent(brandId)}`
  );
}

// ── Order History ───────────────────────────────────────────

export async function apiGetOrderHistory(
  limit = 50
): Promise<ApiResult<{ orders: Array<Record<string, unknown>> }>> {
  return safeFetch<{ orders: Array<Record<string, unknown>> }>(
    `/api/market/trade?limit=${limit}`
  );
}

// ============================================================
//  SMART WRAPPER FUNCTIONS
//  These check USE_API and route to the correct implementation.
//  Every wrapper is async so consumers have a uniform interface
//  regardless of which backend is active.
// ============================================================

// ── Trade Wrappers ──────────────────────────────────────────

export async function smartBuyShares(params: {
  buyerId: string;
  buyerName: string;
  brandId: string;
  shares: number;
}): Promise<{ success: boolean; transaction?: EShareTransaction; error?: string }> {
  if (USE_API) {
    return apiBuyShares({
      brandId: params.brandId,
      quantity: params.shares,
      buyerId: params.buyerId,
      buyerName: params.buyerName,
    });
  }
  return localBuyShares(params);
}

export async function smartSellShares(params: {
  sellerId: string;
  brandId: string;
  shares: number;
}): Promise<{ success: boolean; transaction?: EShareTransaction; error?: string }> {
  if (USE_API) {
    return apiSellShares({
      brandId: params.brandId,
      quantity: params.shares,
      sellerId: params.sellerId,
    });
  }
  return localSellShares(params);
}

// ── Wallet Wrappers ─────────────────────────────────────────

export async function smartGetWalletBalance(
  userId: string
): Promise<Wallet> {
  if (USE_API) {
    const result = await apiGetWalletBalance();
    if (result.success && result.data) {
      // Map the API shape into the Wallet interface the page expects
      return {
        userId,
        balance: result.data.available,
        totalDeposited: result.data.total,
        totalWithdrawn: 0,
        transactions: [],
      };
    }
    // Fallback: return an empty wallet on error
    return {
      userId,
      balance: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      transactions: [],
    };
  }
  return localGetWallet(userId);
}

export async function smartDepositFunds(
  userId: string,
  amount: number
): Promise<{ success: boolean; wallet: Wallet; error?: string }> {
  if (USE_API) {
    const result = await apiDepositFunds(amount);
    if (result.success && result.data?.success) {
      const wallet = await smartGetWalletBalance(userId);
      return { success: true, wallet };
    }
    return {
      success: false,
      wallet: await smartGetWalletBalance(userId),
      error: result.error || result.data?.error || 'Deposit failed',
    };
  }
  return localDeposit(userId, amount);
}

export async function smartWithdrawFunds(
  userId: string,
  amount: number
): Promise<{ success: boolean; wallet: Wallet; error?: string }> {
  if (USE_API) {
    const result = await apiWithdrawFunds(amount);
    if (result.success && result.data?.success) {
      const wallet = await smartGetWalletBalance(userId);
      return { success: true, wallet };
    }
    return {
      success: false,
      wallet: await smartGetWalletBalance(userId),
      error: result.error || result.data?.error || 'Withdrawal failed',
    };
  }
  return localWithdraw(userId, amount);
}

// ── Brand Wrappers ──────────────────────────────────────────

export async function smartGetBrands(): Promise<BrandListing[]> {
  if (USE_API) {
    const result = await apiGetBrands();
    if (result.success && result.data?.brands) {
      return result.data.brands as unknown as BrandListing[];
    }
    return [];
  }
  return localGetBrandListings();
}

export async function smartGetPublicBrands(): Promise<BrandListing[]> {
  if (USE_API) {
    // The API only returns active/public brands by default
    const result = await apiGetBrands();
    if (result.success && result.data?.brands) {
      return result.data.brands as unknown as BrandListing[];
    }
    return [];
  }
  return localGetPublicBrands();
}

export async function smartGetBrandById(
  brandId: string
): Promise<BrandListing | undefined> {
  if (USE_API) {
    const result = await apiGetBrandById(brandId);
    if (result.success && result.data?.brand) {
      return result.data.brand as unknown as BrandListing;
    }
    return undefined;
  }
  return localGetBrandById(brandId);
}

export async function smartGetMyBrands(
  userId: string
): Promise<BrandListing[]> {
  if (USE_API) {
    // Use the IPO route's my-brands action
    const result = await safeFetch<{ brands: Array<Record<string, unknown>> }>(
      '/api/market/ipo?action=my-brands'
    );
    if (result.success && result.data?.brands) {
      return result.data.brands as unknown as BrandListing[];
    }
    return [];
  }
  return localGetMyBrands(userId);
}

// ── Portfolio Wrappers ──────────────────────────────────────

export async function smartGetPortfolio(userId: string): Promise<{
  holdings: ShareHolding[];
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
}> {
  if (USE_API) {
    const result = await apiGetPortfolio();
    if (result.success && result.data?.portfolio) {
      const p = result.data.portfolio;
      return {
        holdings: p.holdings as unknown as ShareHolding[],
        totalValue: p.totalValue,
        totalInvested: p.totalInvested,
        totalGain: p.totalGain,
        totalGainPercent: p.totalGainPercent,
      };
    }
    return {
      holdings: [],
      totalValue: 0,
      totalInvested: 0,
      totalGain: 0,
      totalGainPercent: 0,
    };
  }

  // localStorage path: compute portfolio from raw holdings
  const holdings = localGetMyHoldings(userId);
  const totalInvested = holdings.reduce(
    (sum, h) => sum + (h.totalInvested ?? 0),
    0
  );
  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.currentValue ?? 0),
    0
  );
  const totalGain = totalValue - totalInvested;
  const totalGainPercent =
    totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return { holdings, totalValue, totalInvested, totalGain, totalGainPercent };
}

export async function smartGetMyHoldings(
  userId: string
): Promise<ShareHolding[]> {
  if (USE_API) {
    const portfolio = await smartGetPortfolio(userId);
    return portfolio.holdings;
  }
  return localGetMyHoldings(userId);
}

export async function smartGetHoldingsByBrand(
  brandId: string
): Promise<ShareHolding[]> {
  if (USE_API) {
    // No dedicated API endpoint yet; fall back to localStorage
    // This will be replaced once a holdings-by-brand endpoint exists
    return localGetHoldingsByBrand(brandId);
  }
  return localGetHoldingsByBrand(brandId);
}

export async function smartGetUserHoldingForBrand(
  userId: string,
  brandId: string
): Promise<ShareHolding | undefined> {
  if (USE_API) {
    // No dedicated API endpoint yet; fall back to localStorage
    return localGetUserHoldingForBrand(userId, brandId);
  }
  return localGetUserHoldingForBrand(userId, brandId);
}

// ── Market Stats Wrapper ────────────────────────────────────

export async function smartGetMarketStats(): Promise<MarketStats> {
  if (USE_API) {
    // Derive stats from brands + portfolio endpoints
    const brandsResult = await apiGetBrands();
    const brands = (brandsResult.data?.brands ?? []) as Array<
      Record<string, unknown>
    >;

    const totalMarketCap = brands.reduce(
      (sum, b) => sum + ((b.marketCap as number) || 0),
      0
    );
    const totalVolume24h = brands.reduce(
      (sum, b) => sum + ((b.volume24h as number) || 0),
      0
    );

    return {
      totalBrandsListed: brands.length,
      totalMarketCap,
      totalVolume24h,
      totalInvestors: 0, // Not available from brands endpoint
      platformFeesCollected: 0,
      avgBrandGrowth: 0,
    };
  }
  return localGetMarketStats();
}

// ── Transaction Wrappers ────────────────────────────────────

export async function smartGetTransactionsByBrand(
  brandId: string
): Promise<EShareTransaction[]> {
  if (USE_API) {
    // Trade history endpoint doesn't filter by brand yet; fall back
    return localGetTransactionsByBrand(brandId);
  }
  return localGetTransactionsByBrand(brandId);
}

export async function smartGetTransactionsByUser(
  userId: string
): Promise<EShareTransaction[]> {
  if (USE_API) {
    const result = await apiGetOrderHistory();
    if (result.success && result.data?.orders) {
      return result.data.orders as unknown as EShareTransaction[];
    }
    return [];
  }
  return localGetTransactionsByUser(userId);
}

// ── Brand Creation / IPO Wrappers ───────────────────────────

export async function smartCreateBrandListing(params: {
  brandName: string;
  handle: string;
  platform: BrandListing['platform'];
  description: string;
  founderId: string;
  founderName: string;
  depositAmount: number;
  followers?: number;
  engagement?: number;
}): Promise<BrandListing> {
  if (USE_API) {
    // The API uses the IPO route for brand creation
    const result = await safeFetch<{
      success: boolean;
      brand: Record<string, unknown>;
      error?: string;
    }>('/api/market/ipo', {
      method: 'POST',
      body: JSON.stringify({
        ticker: params.handle.replace(/[@_]/g, '').toUpperCase().slice(0, 5),
        name: params.brandName,
        description: params.description,
        sharesIssued: Math.floor(params.depositAmount * 100),
        initialPrice: 0.01,
        instagramHandle: params.platform === 'instagram' ? params.handle : undefined,
        tiktokHandle: params.platform === 'tiktok' ? params.handle : undefined,
        twitterHandle: params.platform === 'twitter' ? params.handle : undefined,
        youtubeHandle: params.platform === 'youtube' ? params.handle : undefined,
      }),
    });

    if (result.success && result.data?.brand) {
      return result.data.brand as unknown as BrandListing;
    }

    // If API creation fails, throw so the UI can catch it
    throw new Error(
      result.error || result.data?.error || 'Failed to create brand via API'
    );
  }
  return localCreateBrandListing(params);
}

export async function smartGoPublic(
  brandId: string
): Promise<BrandListing | null> {
  if (USE_API) {
    // In API mode, the IPO POST already makes the brand public.
    // This wrapper is kept for parity; it becomes a no-op if the
    // brand was created through the API (already public).
    const brand = await smartGetBrandById(brandId);
    return brand ?? null;
  }
  return localGoPublic(brandId);
}

export async function smartSignTransparencyAgreement(params: {
  brandId: string;
  founderId: string;
  founderSignature: string;
}): Promise<TransparencyAgreement> {
  if (USE_API) {
    // The API IPO flow handles agreements internally.
    // Return a synthetic agreement to satisfy the UI contract.
    return {
      brandId: params.brandId,
      founderId: params.founderId,
      founderSignature: params.founderSignature,
      agreementVersion: '1.0',
      acknowledgedNoGuaranteedProfit: true,
      acknowledgedCommunitySupport: true,
      acknowledgedLockInPeriod: true,
      acknowledgedPlatformFees: true,
      acknowledgedRiskDisclosure: true,
      signedAt: Date.now(),
    };
  }
  return localSignAgreement(params);
}

// ── Seed Data Wrapper ───────────────────────────────────────

export async function smartSeedMarketIfEmpty(): Promise<void> {
  if (USE_API) {
    // In API mode the database is pre-seeded by migrations or
    // the admin panel. Nothing to do client-side.
    return;
  }
  localSeedMarket();
}
