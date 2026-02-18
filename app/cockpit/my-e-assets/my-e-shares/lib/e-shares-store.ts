'use client';

/**
 * E-SHARES LOCAL STORAGE MANAGER
 * Handles all data persistence for the e-shares system
 */

import {
  BrandListing,
  ShareHolding,
  EShareTransaction,
  TransparencyAgreement,
  MarketStats,
  BuyOrder,
  SellOrder,
  E_SHARES_CONFIG,
} from '../types/e-shares';

// Storage Keys
const KEYS = {
  BRAND_LISTINGS: 'e-shares-brand-listings',
  SHARE_HOLDINGS: 'e-shares-holdings',
  TRANSACTIONS: 'e-shares-transactions',
  TRANSPARENCY_AGREEMENTS: 'e-shares-agreements',
  MARKET_STATS: 'e-shares-market-stats',
  BUY_ORDERS: 'e-shares-buy-orders',
  SELL_ORDERS: 'e-shares-sell-orders',
  PLATFORM_FEES: 'e-shares-platform-fees',
  PRICE_HISTORY: 'e-shares-price-history',
} as const;

// ============================================
// GENERIC STORAGE HELPERS
// ============================================

function getStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const raw = localStorage.getItem(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ============================================
// BRAND LISTINGS
// ============================================

export function getBrandListings(): BrandListing[] {
  return getStorage<BrandListing[]>(KEYS.BRAND_LISTINGS, []);
}

export function getBrandById(id: string): BrandListing | undefined {
  return getBrandListings().find((b) => b.id === id);
}

export function getPublicBrands(): BrandListing[] {
  return getBrandListings().filter(
    (b) => b.status === 'PUBLIC' || b.status === 'TRADING'
  );
}

export function getMyBrands(userId: string): BrandListing[] {
  return getBrandListings().filter((b) => b.founderId === userId);
}

export function saveBrandListing(brand: BrandListing): void {
  const listings = getBrandListings();
  const index = listings.findIndex((b) => b.id === brand.id);
  if (index >= 0) {
    listings[index] = brand;
  } else {
    listings.push(brand);
  }
  setStorage(KEYS.BRAND_LISTINGS, listings);
}

export function createBrandListing(
  params: {
    brandName: string;
    handle: string;
    platform: BrandListing['platform'];
    description: string;
    founderId: string;
    founderName: string;
    depositAmount: number;
    followers?: number;
    engagement?: number;
  }
): BrandListing {
  const { depositAmount } = params;

  // Calculate shares: 100 shares per $1 deposited
  const totalShares = Math.floor(depositAmount * E_SHARES_CONFIG.SHARES_PER_DOLLAR);

  // Initial price is $0.01 per share (same as deposit ratio)
  const basePrice = 0.01;

  // Founder keeps 60% of shares locked, 40% available for public
  const founderSharesLocked = Math.floor(totalShares * 0.6);
  const publicSharesAvailable = totalShares - founderSharesLocked;

  const now = Date.now();
  const lockExpiry = now + E_SHARES_CONFIG.FOUNDER_LOCK_PERIOD_MS;

  const brand: BrandListing = {
    id: crypto.randomUUID(),
    brandName: params.brandName,
    handle: params.handle,
    platform: params.platform,
    description: params.description,
    founderId: params.founderId,
    founderName: params.founderName,
    totalDeposit: depositAmount,
    totalShares,
    pricePerShare: basePrice,
    basePrice,
    marketCap: totalShares * basePrice,
    volume24h: 0,
    priceChange24h: 0,
    followers: params.followers || 0,
    engagement: params.engagement || 0,
    growthRate: 0,
    status: 'PRIVATE',
    listedAt: 0,
    lockExpiry,
    transparencyAgreementSigned: false,
    founderSharesLocked,
    founderSharesAvailable: 0,
    publicSharesAvailable,
    publicSharesSold: 0,
  };

  saveBrandListing(brand);

  // Create founder's initial holding
  const founderHolding: ShareHolding = {
    id: crypto.randomUUID(),
    userId: params.founderId,
    userName: params.founderName,
    brandId: brand.id,
    brandName: brand.brandName,
    shares: founderSharesLocked,
    averageCost: 0, // Founder didn't "buy" - they deposited
    totalInvested: depositAmount,
    currentValue: founderSharesLocked * basePrice,
    unrealizedGain: 0,
    unrealizedGainPercent: 0,
    holderType: 'FOUNDER',
    firstPurchaseAt: now,
    lastPurchaseAt: now,
    isLocked: true,
    lockExpiry,
  };

  saveShareHolding(founderHolding);

  // Log the transaction
  logEShareTransaction({
    type: 'DEPOSIT',
    brandId: brand.id,
    brandName: brand.brandName,
    toUserId: params.founderId,
    shares: 0,
    pricePerShare: 0,
    totalAmount: depositAmount,
    platformFee: 0,
    netAmount: depositAmount,
    status: 'COMPLETED',
  });

  logEShareTransaction({
    type: 'MINT',
    brandId: brand.id,
    brandName: brand.brandName,
    toUserId: params.founderId,
    shares: totalShares,
    pricePerShare: basePrice,
    totalAmount: totalShares * basePrice,
    platformFee: 0,
    netAmount: totalShares * basePrice,
    status: 'COMPLETED',
  });

  return brand;
}

export function goPublic(brandId: string): BrandListing | null {
  const brand = getBrandById(brandId);
  if (!brand) return null;
  if (!brand.transparencyAgreementSigned) return null;

  brand.status = 'PUBLIC';
  brand.listedAt = Date.now();
  saveBrandListing(brand);

  return brand;
}

// ============================================
// SHARE HOLDINGS
// ============================================

export function getShareHoldings(): ShareHolding[] {
  return getStorage<ShareHolding[]>(KEYS.SHARE_HOLDINGS, []);
}

export function getMyHoldings(userId: string): ShareHolding[] {
  return getShareHoldings().filter((h) => h.userId === userId);
}

export function getHoldingsByBrand(brandId: string): ShareHolding[] {
  return getShareHoldings().filter((h) => h.brandId === brandId);
}

export function getUserHoldingForBrand(
  userId: string,
  brandId: string
): ShareHolding | undefined {
  return getShareHoldings().find(
    (h) => h.userId === userId && h.brandId === brandId
  );
}

export function saveShareHolding(holding: ShareHolding): void {
  const holdings = getShareHoldings();
  const index = holdings.findIndex((h) => h.id === holding.id);
  if (index >= 0) {
    holdings[index] = holding;
  } else {
    holdings.push(holding);
  }
  setStorage(KEYS.SHARE_HOLDINGS, holdings);
}

// ============================================
// TRANSACTIONS
// ============================================

export function getTransactions(): EShareTransaction[] {
  return getStorage<EShareTransaction[]>(KEYS.TRANSACTIONS, []);
}

export function getTransactionsByBrand(brandId: string): EShareTransaction[] {
  return getTransactions().filter((t) => t.brandId === brandId);
}

export function getTransactionsByUser(userId: string): EShareTransaction[] {
  return getTransactions().filter(
    (t) => t.fromUserId === userId || t.toUserId === userId
  );
}

export function logEShareTransaction(
  params: Omit<EShareTransaction, 'id' | 'timestamp'>
): EShareTransaction {
  const transaction: EShareTransaction = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    ...params,
  };

  const transactions = getTransactions();
  transactions.push(transaction);
  setStorage(KEYS.TRANSACTIONS, transactions);

  // Update platform fees collected
  if (params.platformFee > 0) {
    const fees = getPlatformFeesCollected();
    setStorage(KEYS.PLATFORM_FEES, fees + params.platformFee);
  }

  return transaction;
}

// ============================================
// BUY/SELL OPERATIONS
// ============================================

export function buyShares(params: {
  buyerId: string;
  buyerName: string;
  brandId: string;
  shares: number;
}): { success: boolean; transaction?: EShareTransaction; error?: string } {
  const brand = getBrandById(params.brandId);
  if (!brand) return { success: false, error: 'Brand not found' };

  if (brand.status !== 'PUBLIC' && brand.status !== 'TRADING') {
    return { success: false, error: 'Brand is not open for investment' };
  }

  if (params.shares > (brand.publicSharesAvailable ?? 0)) {
    return { success: false, error: 'Not enough shares available' };
  }

  const pricePerShare = brand.pricePerShare ?? 0.01;
  const totalAmount = params.shares * pricePerShare;
  const platformFee = params.shares * E_SHARES_CONFIG.PLATFORM_FEE_PER_SHARE;
  const netAmount = totalAmount + platformFee; // Buyer pays total + fee

  // Update brand
  brand.publicSharesAvailable = (brand.publicSharesAvailable ?? 0) - params.shares;
  brand.publicSharesSold = (brand.publicSharesSold ?? 0) + params.shares;
  brand.volume24h = (brand.volume24h ?? 0) + totalAmount;

  // Apply demand-based price increase (simple version)
  const totalShares = brand.totalShares ?? 1;
  const demandFactor = 1 + (params.shares / totalShares) * 0.1;
  brand.pricePerShare = Math.min(
    pricePerShare * demandFactor,
    (brand.basePrice ?? 0.01) * E_SHARES_CONFIG.MAX_PRICE_MULTIPLIER
  );
  brand.marketCap = totalShares * brand.pricePerShare;

  saveBrandListing(brand);

  // Update or create buyer's holding
  let holding = getUserHoldingForBrand(params.buyerId, params.brandId);
  const now = Date.now();

  if (holding) {
    // Update existing holding
    const heldShares = (holding.shares ?? 0) + params.shares;
    const totalInvested = (holding.totalInvested ?? 0) + totalAmount;
    holding.shares = heldShares;
    holding.totalInvested = totalInvested;
    holding.averageCost = totalInvested / heldShares;
    holding.currentValue = heldShares * (brand.pricePerShare ?? 0.01);
    holding.unrealizedGain = holding.currentValue - totalInvested;
    holding.unrealizedGainPercent =
      totalInvested > 0
        ? ((holding.currentValue - totalInvested) / totalInvested) * 100
        : 0;
    holding.lastPurchaseAt = now;
  } else {
    // Create new holding
    holding = {
      id: crypto.randomUUID(),
      userId: params.buyerId,
      userName: params.buyerName,
      brandId: params.brandId,
      brandName: brand.brandName,
      shares: params.shares,
      averageCost: pricePerShare,
      totalInvested: totalAmount,
      currentValue: params.shares * brand.pricePerShare,
      unrealizedGain: 0,
      unrealizedGainPercent: 0,
      holderType: 'INVESTOR',
      firstPurchaseAt: now,
      lastPurchaseAt: now,
      isLocked: false,
    };
  }

  saveShareHolding(holding);

  // Log transaction
  const transaction = logEShareTransaction({
    type: 'BUY',
    brandId: params.brandId,
    brandName: brand.brandName,
    toUserId: params.buyerId,
    shares: params.shares,
    pricePerShare,
    totalAmount,
    platformFee,
    netAmount,
    status: 'COMPLETED',
  });

  return { success: true, transaction };
}

export function sellShares(params: {
  sellerId: string;
  brandId: string;
  shares: number;
}): { success: boolean; transaction?: EShareTransaction; error?: string } {
  const brand = getBrandById(params.brandId);
  if (!brand) return { success: false, error: 'Brand not found' };

  const holding = getUserHoldingForBrand(params.sellerId, params.brandId);
  if (!holding) return { success: false, error: 'You do not own shares in this brand' };

  // Check lock status
  if (holding.isLocked && holding.lockExpiry && Date.now() < holding.lockExpiry) {
    const lockDate = new Date(holding.lockExpiry).toLocaleDateString();
    return {
      success: false,
      error: `Your shares are locked until ${lockDate}`,
    };
  }

  if (params.shares > (holding.shares ?? 0)) {
    return { success: false, error: 'Not enough shares to sell' };
  }

  const pricePerShare = brand.pricePerShare ?? 0.01;
  const totalAmount = params.shares * pricePerShare;
  const platformFee = params.shares * E_SHARES_CONFIG.PLATFORM_FEE_PER_SHARE;
  const netAmount = totalAmount - platformFee; // Seller receives total - fee

  // Update brand
  brand.publicSharesAvailable = (brand.publicSharesAvailable ?? 0) + params.shares;
  brand.publicSharesSold = (brand.publicSharesSold ?? 0) - params.shares;
  brand.volume24h = (brand.volume24h ?? 0) + totalAmount;

  // Apply supply-based price decrease (simple version)
  const sellTotalShares = brand.totalShares ?? 1;
  const supplyFactor = 1 - (params.shares / sellTotalShares) * 0.1;
  brand.pricePerShare = Math.max(
    pricePerShare * supplyFactor,
    (brand.basePrice ?? 0.01) * E_SHARES_CONFIG.MIN_PRICE_MULTIPLIER
  );
  brand.marketCap = sellTotalShares * brand.pricePerShare;

  saveBrandListing(brand);

  // Update holding
  const costBasis = (holding.averageCost ?? 0) * params.shares;
  holding.shares = (holding.shares ?? 0) - params.shares;
  holding.totalInvested = (holding.totalInvested ?? 0) - costBasis;

  if (holding.shares === 0) {
    // Remove holding if no shares left
    const holdings = getShareHoldings().filter((h) => h.id !== holding.id);
    setStorage(KEYS.SHARE_HOLDINGS, holdings);
  } else {
    holding.currentValue = holding.shares * (brand.pricePerShare ?? 0.01);
    holding.unrealizedGain = holding.currentValue - (holding.totalInvested ?? 0);
    holding.unrealizedGainPercent =
      (holding.totalInvested ?? 0) > 0
        ? ((holding.currentValue - (holding.totalInvested ?? 0)) / (holding.totalInvested ?? 1)) * 100
        : 0;
    saveShareHolding(holding);
  }

  // Log transaction
  const transaction = logEShareTransaction({
    type: 'SELL',
    brandId: params.brandId,
    brandName: brand.brandName,
    fromUserId: params.sellerId,
    shares: params.shares,
    pricePerShare,
    totalAmount,
    platformFee,
    netAmount,
    status: 'COMPLETED',
  });

  return { success: true, transaction };
}

// ============================================
// TRANSPARENCY AGREEMENTS
// ============================================

export function getTransparencyAgreements(): TransparencyAgreement[] {
  return getStorage<TransparencyAgreement[]>(KEYS.TRANSPARENCY_AGREEMENTS, []);
}

export function getAgreementForBrand(
  brandId: string
): TransparencyAgreement | undefined {
  return getTransparencyAgreements().find((a) => a.brandId === brandId);
}

export function signTransparencyAgreement(params: {
  brandId: string;
  founderId: string;
  founderSignature: string;
}): TransparencyAgreement {
  const agreement: TransparencyAgreement = {
    brandId: params.brandId,
    founderId: params.founderId,
    agreementVersion: '1.0',
    acknowledgedNoGuaranteedProfit: true,
    acknowledgedCommunitySupport: true,
    acknowledgedLockInPeriod: true,
    acknowledgedPlatformFees: true,
    acknowledgedRiskDisclosure: true,
    founderSignature: params.founderSignature,
    signedAt: Date.now(),
  };

  const agreements = getTransparencyAgreements();
  agreements.push(agreement);
  setStorage(KEYS.TRANSPARENCY_AGREEMENTS, agreements);

  // Update brand
  const brand = getBrandById(params.brandId);
  if (brand) {
    brand.transparencyAgreementSigned = true;
    brand.transparencyAgreementDate = agreement.signedAt;
    saveBrandListing(brand);
  }

  return agreement;
}

// ============================================
// MARKET STATS
// ============================================

export function getMarketStats(): MarketStats {
  const brands = getBrandListings();
  const publicBrands = brands.filter(
    (b) => b.status === 'PUBLIC' || b.status === 'TRADING'
  );
  const holdings = getShareHoldings();
  const uniqueInvestors = new Set(
    holdings.filter((h) => h.holderType === 'INVESTOR').map((h) => h.userId)
  );

  return {
    totalBrandsListed: publicBrands.length,
    totalMarketCap: publicBrands.reduce((sum, b) => sum + (b.marketCap ?? 0), 0),
    totalVolume24h: publicBrands.reduce((sum, b) => sum + (b.volume24h ?? 0), 0),
    totalInvestors: uniqueInvestors.size,
    platformFeesCollected: getPlatformFeesCollected(),
    avgBrandGrowth:
      publicBrands.length > 0
        ? publicBrands.reduce((sum, b) => sum + (b.growthRate ?? 0), 0) /
          publicBrands.length
        : 0,
  };
}

export function getPlatformFeesCollected(): number {
  return getStorage<number>(KEYS.PLATFORM_FEES, 0);
}

// ============================================
// PRICE HISTORY TRACKING
// ============================================

export interface PricePoint {
  brandId: string;
  price: number;
  timestamp: number;
}

export function recordPricePoint(brandId: string, price: number): void {
  if (typeof window === 'undefined') return;

  const allHistory = getStorage<Record<string, PricePoint[]>>(KEYS.PRICE_HISTORY, {});
  const brandHistory = allHistory[brandId] || [];

  brandHistory.push({
    brandId,
    price,
    timestamp: Date.now(),
  });

  // Keep max 100 points per brand
  if (brandHistory.length > 100) {
    allHistory[brandId] = brandHistory.slice(brandHistory.length - 100);
  } else {
    allHistory[brandId] = brandHistory;
  }

  setStorage(KEYS.PRICE_HISTORY, allHistory);
}

export function getPriceHistory(brandId: string, limit?: number): PricePoint[] {
  const allHistory = getStorage<Record<string, PricePoint[]>>(KEYS.PRICE_HISTORY, {});
  const brandHistory = allHistory[brandId] || [];

  // Return most recent first
  const sorted = [...brandHistory].sort((a, b) => b.timestamp - a.timestamp);

  if (limit && limit > 0) {
    return sorted.slice(0, limit);
  }
  return sorted;
}

// ============================================
// PRICE FLUCTUATION (for ticker display)
// ============================================

// Momentum state tracked per-brand across calls
const _momentumState: Record<string, { direction: number; streak: number }> = {};

export function applyMicroFluctuation(
  currentPrice: number,
  basePrice?: number,
  engagement?: number
): { value: number; direction: 'up' | 'down' | 'neutral' } {
  const fluctuationRange = E_SHARES_CONFIG.MICRO_FLUCTUATION_PERCENT / 100;

  // Use a deterministic key based on the current price for momentum tracking
  const stateKey = currentPrice.toFixed(6);

  // Initialize or retrieve momentum state
  if (!_momentumState[stateKey]) {
    _momentumState[stateKey] = { direction: 0, streak: 0 };
  }
  const momentum = _momentumState[stateKey];

  // --- Engagement bias ---
  // Higher engagement brands tend to drift upward slightly
  let engagementBias = 0;
  if (engagement && engagement > 0) {
    // Engagement rates 1-10% map to a small upward bias of 0.0 to 0.002
    engagementBias = Math.min(engagement / 100, 0.08) * 0.025;
  }

  // --- Momentum factor ---
  // Trending direction tends to persist (mean reversion after long streaks)
  let momentumFactor = 0;
  if (momentum.streak > 3) {
    // After 3+ consecutive moves in one direction, increase reversal chance
    const reversalChance = Math.min(0.7, 0.15 * (momentum.streak - 3));
    if (Math.random() < reversalChance) {
      momentumFactor = -momentum.direction * fluctuationRange * 0.3;
      momentum.direction = 0;
      momentum.streak = 0;
    } else {
      momentumFactor = momentum.direction * fluctuationRange * 0.2;
    }
  } else if (momentum.streak > 0) {
    // Continue the trend with decreasing strength
    momentumFactor = momentum.direction * fluctuationRange * 0.15;
  }

  // --- Market event check (3% chance) ---
  let eventMultiplier = 1;
  if (Math.random() < 0.03) {
    // Big move: 2-5% in either direction
    eventMultiplier = 4 + Math.random() * 6; // 4x to 10x normal fluctuation
  }

  // --- Base random change ---
  const rawChange = (Math.random() - 0.5) * 2 * fluctuationRange;

  // --- Combine all factors ---
  const totalChange = (rawChange + engagementBias + momentumFactor) * eventMultiplier;
  let newPrice = currentPrice * (1 + totalChange);

  // --- Enforce price bounds if basePrice is provided ---
  if (basePrice && basePrice > 0) {
    const maxPrice = basePrice * E_SHARES_CONFIG.MAX_PRICE_MULTIPLIER;
    const minPrice = basePrice * E_SHARES_CONFIG.MIN_PRICE_MULTIPLIER;
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
  }

  // Never go below 0.1 cents
  newPrice = Math.max(0.001, newPrice);

  // --- Update momentum state ---
  const changePercent = (newPrice - currentPrice) / currentPrice;
  if (changePercent > 0.0001) {
    if (momentum.direction > 0) {
      momentum.streak++;
    } else {
      momentum.direction = 1;
      momentum.streak = 1;
    }
  } else if (changePercent < -0.0001) {
    if (momentum.direction < 0) {
      momentum.streak++;
    } else {
      momentum.direction = -1;
      momentum.streak = 1;
    }
  }

  // Determine direction label
  const direction: 'up' | 'down' | 'neutral' =
    changePercent > 0.0005 ? 'up' : changePercent < -0.0005 ? 'down' : 'neutral';

  return { value: newPrice, direction };
}

// ============================================
// SEED DATA (for demo)
// ============================================

export function seedESharesMarketIfEmpty(): void {
  if (typeof window === 'undefined') return;

  const existing = getBrandListings();
  if (existing.length > 0) return;

  // Create 8 diverse demo brands across platforms
  const demoBrands: Partial<Parameters<typeof createBrandListing>[0]>[] = [
    {
      brandName: 'Urban Signal',
      handle: '@urban_signal',
      platform: 'instagram',
      description:
        'Street culture and urban lifestyle content. Authentic city aesthetics from NYC, Tokyo, and London with 3 posts daily.',
      founderId: 'demo-founder-1',
      founderName: 'Marcus Chen',
      depositAmount: 500,
      followers: 45000,
      engagement: 4.2,
    },
    {
      brandName: 'Tech Insights Daily',
      handle: '@tech_insights',
      platform: 'twitter',
      description:
        'Breaking tech news and analysis with 200K+ impressions per thread. Trusted source for Silicon Valley scoops since 2021.',
      founderId: 'demo-founder-2',
      founderName: 'Sarah Kim',
      depositAmount: 1000,
      followers: 128000,
      engagement: 3.8,
    },
    {
      brandName: 'Fitness Revolution',
      handle: '@fit_revolution',
      platform: 'tiktok',
      description:
        'Transform your body, transform your life. 30-second workout routines that have helped 50K+ people hit their goals.',
      founderId: 'demo-founder-3',
      founderName: 'Jake Morrison',
      depositAmount: 250,
      followers: 89000,
      engagement: 6.1,
    },
    {
      brandName: 'Neon Beats',
      handle: '@neon_beats',
      platform: 'youtube',
      description:
        'Electronic music producer and DJ. Weekly livestream sets averaging 15K concurrent viewers. Label deal pending.',
      founderId: 'demo-founder-4',
      founderName: 'Priya Patel',
      depositAmount: 2000,
      followers: 340000,
      engagement: 5.7,
    },
    {
      brandName: 'Wanderlust Eats',
      handle: '@wanderlust_eats',
      platform: 'tiktok',
      description:
        'Street food explorer visiting 40+ countries. Every video features local chefs and hidden gem restaurants.',
      founderId: 'demo-founder-5',
      founderName: 'Diego Ramirez',
      depositAmount: 750,
      followers: 210000,
      engagement: 7.8,
    },
    {
      brandName: 'CodeCraft',
      handle: '@codecraft_dev',
      platform: 'youtube',
      description:
        'Open-source tutorials and system design deep dives. 95% like ratio, 2M+ total views. Building the next generation of developers.',
      founderId: 'demo-founder-6',
      founderName: 'Amara Okafor',
      depositAmount: 5000,
      followers: 890000,
      engagement: 3.2,
    },
    {
      brandName: 'Velvet Thread',
      handle: '@velvet.thread',
      platform: 'instagram',
      description:
        'Sustainable fashion brand blending vintage aesthetics with modern streetwear. Sold out 3 capsule collections in 2024.',
      founderId: 'demo-founder-7',
      founderName: 'Lena Kovacs',
      depositAmount: 1500,
      followers: 67000,
      engagement: 8.0,
    },
    {
      brandName: 'The Daily Take',
      handle: '@thedailytake',
      platform: 'twitter',
      description:
        'Political commentary and media analysis with nuance. Quoted by major outlets. 50K newsletter subscribers and growing.',
      founderId: 'demo-founder-8',
      founderName: 'Jordan Blake',
      depositAmount: 100,
      followers: 15000,
      engagement: 1.5,
    },
  ];

  // Pool of simulated investors
  const investors = [
    { id: 'demo-investor-1', name: 'Alex Thompson' },
    { id: 'demo-investor-2', name: 'Jordan Lee' },
    { id: 'demo-investor-3', name: 'Morgan Davis' },
    { id: 'demo-investor-4', name: 'Casey Nguyen' },
    { id: 'demo-investor-5', name: 'Riley Parker' },
    { id: 'demo-investor-6', name: 'Sam Martinez' },
    { id: 'demo-investor-7', name: 'Avery Scott' },
    { id: 'demo-investor-8', name: 'Quinn Foster' },
    { id: 'demo-investor-9', name: 'Reese Tanaka' },
    { id: 'demo-investor-10', name: 'Blake Warren' },
  ];

  demoBrands.forEach((params) => {
    const brand = createBrandListing(params as Parameters<typeof createBrandListing>[0]);

    // Sign agreement and go public
    signTransparencyAgreement({
      brandId: brand.id,
      founderId: brand.founderId ?? '',
      founderSignature: brand.founderName ?? '',
    });

    goPublic(brand.id);

    // Simulate diverse trading activity
    // Higher-deposit brands attract more investors
    const depositTier = params.depositAmount ?? 250;
    const investorCount = depositTier >= 2000 ? 7 : depositTier >= 750 ? 5 : 3;

    // Shuffle investors and pick a subset
    const shuffled = [...investors].sort(() => Math.random() - 0.5);
    const activeInvestors = shuffled.slice(0, investorCount);

    // Round 1: Initial buys
    activeInvestors.forEach((investor) => {
      const shareAmount = Math.floor(
        (Math.random() * 800 + 100) * (depositTier / 500)
      );
      buyShares({
        buyerId: investor.id,
        buyerName: investor.name,
        brandId: brand.id,
        shares: Math.min(shareAmount, (brand.publicSharesAvailable ?? 1000) - 50),
      });
    });

    // Round 2: Some investors buy more (doubling down)
    activeInvestors.slice(0, Math.floor(activeInvestors.length / 2)).forEach((investor) => {
      if (Math.random() > 0.4) {
        const currentBrand = getBrandById(brand.id);
        if (currentBrand && (currentBrand.publicSharesAvailable ?? 0) > 100) {
          buyShares({
            buyerId: investor.id,
            buyerName: investor.name,
            brandId: brand.id,
            shares: Math.floor(Math.random() * 300) + 50,
          });
        }
      }
    });

    // Round 3: A couple of investors sell some shares (profit taking / rebalancing)
    if (activeInvestors.length >= 3) {
      const sellers = activeInvestors.slice(-2);
      sellers.forEach((seller) => {
        if (Math.random() > 0.5) {
          const holding = getUserHoldingForBrand(seller.id, brand.id);
          if (holding && (holding.shares ?? 0) > 50) {
            const sellAmount = Math.floor((holding.shares ?? 0) * (0.1 + Math.random() * 0.3));
            if (sellAmount > 0) {
              sellShares({
                sellerId: seller.id,
                brandId: brand.id,
                shares: sellAmount,
              });
            }
          }
        }
      });
    }

    // Seed initial price history (20 data points over the past 7 days)
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const intervalMs = sevenDaysMs / 20;
    const currentBrand = getBrandById(brand.id);
    const bPrice = currentBrand?.basePrice ?? 0.01;
    const currentPriceVal = currentBrand?.pricePerShare ?? bPrice;

    // Generate a realistic price path from basePrice toward currentPrice
    let walkPrice = bPrice;
    const priceDelta = currentPriceVal - bPrice;

    for (let i = 0; i < 20; i++) {
      const progress = (i + 1) / 20;
      // Trend component: linear interpolation from base to current
      const trendPrice = bPrice + priceDelta * progress;
      // Noise component: random walk with decreasing variance as we approach present
      const noiseScale = bPrice * 0.08 * (1 - progress * 0.5);
      const noise = (Math.random() - 0.5) * 2 * noiseScale;
      walkPrice = trendPrice + noise;
      // Clamp within valid bounds
      walkPrice = Math.max(
        bPrice * E_SHARES_CONFIG.MIN_PRICE_MULTIPLIER,
        Math.min(bPrice * E_SHARES_CONFIG.MAX_PRICE_MULTIPLIER, walkPrice)
      );

      const timestamp = now - sevenDaysMs + intervalMs * (i + 1);
      // Directly write to storage to set historical timestamps
      const allHistory = getStorage<Record<string, PricePoint[]>>(KEYS.PRICE_HISTORY, {});
      const brandHistory = allHistory[brand.id] || [];
      brandHistory.push({
        brandId: brand.id,
        price: walkPrice,
        timestamp,
      });
      allHistory[brand.id] = brandHistory;
      setStorage(KEYS.PRICE_HISTORY, allHistory);
    }
  });
}
