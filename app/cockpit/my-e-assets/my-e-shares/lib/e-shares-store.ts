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

  if (params.shares > brand.publicSharesAvailable) {
    return { success: false, error: 'Not enough shares available' };
  }

  const pricePerShare = brand.pricePerShare;
  const totalAmount = params.shares * pricePerShare;
  const platformFee = params.shares * E_SHARES_CONFIG.PLATFORM_FEE_PER_SHARE;
  const netAmount = totalAmount + platformFee; // Buyer pays total + fee

  // Update brand
  brand.publicSharesAvailable -= params.shares;
  brand.publicSharesSold += params.shares;
  brand.volume24h += totalAmount;

  // Apply demand-based price increase (simple version)
  const demandFactor = 1 + (params.shares / brand.totalShares) * 0.1;
  brand.pricePerShare = Math.min(
    brand.pricePerShare * demandFactor,
    brand.basePrice * E_SHARES_CONFIG.MAX_PRICE_MULTIPLIER
  );
  brand.marketCap = brand.totalShares * brand.pricePerShare;

  saveBrandListing(brand);

  // Update or create buyer's holding
  let holding = getUserHoldingForBrand(params.buyerId, params.brandId);
  const now = Date.now();

  if (holding) {
    // Update existing holding
    const totalShares = holding.shares + params.shares;
    const totalInvested = holding.totalInvested + totalAmount;
    holding.shares = totalShares;
    holding.totalInvested = totalInvested;
    holding.averageCost = totalInvested / totalShares;
    holding.currentValue = totalShares * brand.pricePerShare;
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

  if (params.shares > holding.shares) {
    return { success: false, error: 'Not enough shares to sell' };
  }

  const pricePerShare = brand.pricePerShare;
  const totalAmount = params.shares * pricePerShare;
  const platformFee = params.shares * E_SHARES_CONFIG.PLATFORM_FEE_PER_SHARE;
  const netAmount = totalAmount - platformFee; // Seller receives total - fee

  // Update brand
  brand.publicSharesAvailable += params.shares;
  brand.publicSharesSold -= params.shares;
  brand.volume24h += totalAmount;

  // Apply supply-based price decrease (simple version)
  const supplyFactor = 1 - (params.shares / brand.totalShares) * 0.1;
  brand.pricePerShare = Math.max(
    brand.pricePerShare * supplyFactor,
    brand.basePrice * E_SHARES_CONFIG.MIN_PRICE_MULTIPLIER
  );
  brand.marketCap = brand.totalShares * brand.pricePerShare;

  saveBrandListing(brand);

  // Update holding
  const costBasis = holding.averageCost * params.shares;
  holding.shares -= params.shares;
  holding.totalInvested -= costBasis;

  if (holding.shares === 0) {
    // Remove holding if no shares left
    const holdings = getShareHoldings().filter((h) => h.id !== holding.id);
    setStorage(KEYS.SHARE_HOLDINGS, holdings);
  } else {
    holding.currentValue = holding.shares * brand.pricePerShare;
    holding.unrealizedGain = holding.currentValue - holding.totalInvested;
    holding.unrealizedGainPercent =
      holding.totalInvested > 0
        ? ((holding.currentValue - holding.totalInvested) / holding.totalInvested) * 100
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
    totalMarketCap: publicBrands.reduce((sum, b) => sum + b.marketCap, 0),
    totalVolume24h: publicBrands.reduce((sum, b) => sum + b.volume24h, 0),
    totalInvestors: uniqueInvestors.size,
    platformFeesCollected: getPlatformFeesCollected(),
    avgBrandGrowth:
      publicBrands.length > 0
        ? publicBrands.reduce((sum, b) => sum + b.growthRate, 0) /
          publicBrands.length
        : 0,
  };
}

export function getPlatformFeesCollected(): number {
  return getStorage<number>(KEYS.PLATFORM_FEES, 0);
}

// ============================================
// PRICE FLUCTUATION (for ticker display)
// ============================================

export function applyMicroFluctuation(
  currentPrice: number
): { value: number; direction: 'up' | 'down' | 'neutral' } {
  const fluctuationRange = E_SHARES_CONFIG.MICRO_FLUCTUATION_PERCENT / 100;
  const change = (Math.random() - 0.5) * 2 * fluctuationRange;
  const newPrice = currentPrice * (1 + change);

  return {
    value: Math.max(0.001, newPrice), // Never go below 0.1 cents
    direction: change > 0.001 ? 'up' : change < -0.001 ? 'down' : 'neutral',
  };
}

// ============================================
// SEED DATA (for demo)
// ============================================

export function seedESharesMarketIfEmpty(): void {
  if (typeof window === 'undefined') return;

  const existing = getBrandListings();
  if (existing.length > 0) return;

  // Create demo brands
  const demoBrands: Partial<Parameters<typeof createBrandListing>[0]>[] = [
    {
      brandName: 'Urban Signal',
      handle: '@urban_signal',
      platform: 'instagram',
      description:
        'Street culture and urban lifestyle content. Building a community around authentic city aesthetics.',
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
        'Breaking tech news and analysis. First to report, always accurate.',
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
        'Transform your body, transform your life. Daily workout tips and motivation.',
      founderId: 'demo-founder-3',
      founderName: 'Jake Morrison',
      depositAmount: 250,
      followers: 89000,
      engagement: 6.1,
    },
  ];

  demoBrands.forEach((params) => {
    const brand = createBrandListing(params as Parameters<typeof createBrandListing>[0]);

    // Sign agreement and go public
    signTransparencyAgreement({
      brandId: brand.id,
      founderId: brand.founderId,
      founderSignature: brand.founderName,
    });

    goPublic(brand.id);

    // Simulate some trading activity
    const investors = [
      { id: 'demo-investor-1', name: 'Alex Thompson' },
      { id: 'demo-investor-2', name: 'Jordan Lee' },
      { id: 'demo-investor-3', name: 'Taylor Swift Fan' },
    ];

    investors.forEach((investor) => {
      if (Math.random() > 0.4) {
        buyShares({
          buyerId: investor.id,
          buyerName: investor.name,
          brandId: brand.id,
          shares: Math.floor(Math.random() * 500) + 100,
        });
      }
    });
  });
}
