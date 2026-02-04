/**
 * SOCIAL EXCHANGE - MARKETPLACE TYPES
 * Digital Asset Transfer Platform
 */

// ============================================
// LISTING TYPES
// ============================================

export type Platform = 'instagram' | 'tiktok' | 'twitter' | 'youtube' | 'facebook';

export type ListingStatus =
  | 'draft'           // Not yet published
  | 'pending_review'  // Awaiting platform verification
  | 'active'          // Live and accepting offers
  | 'under_offer'     // Has accepted offer, in escrow
  | 'sold'            // Transaction complete
  | 'withdrawn'       // Seller removed listing
  | 'suspended';      // Flagged by platform

export type AccountNiche =
  | 'lifestyle'
  | 'fashion'
  | 'fitness'
  | 'food'
  | 'travel'
  | 'tech'
  | 'gaming'
  | 'music'
  | 'art'
  | 'business'
  | 'education'
  | 'entertainment'
  | 'sports'
  | 'beauty'
  | 'pets'
  | 'automotive'
  | 'other';

export type AccountVerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'failed';

export interface AccountMetrics {
  followers: number;
  following: number;
  posts: number;
  avgLikes: number;
  avgComments: number;
  engagementRate: number;  // (avgLikes + avgComments) / followers * 100
  reachEstimate?: number;
  impressionsEstimate?: number;
  audienceDemo?: {
    topCountries: { country: string; percentage: number }[];
    ageRanges: { range: string; percentage: number }[];
    genderSplit: { male: number; female: number; other: number };
  };
}

export interface MarketListing {
  id: string;

  // Seller info
  sellerId: string;
  sellerUsername: string;
  sellerRating: number;
  sellerTotalSales: number;

  // Account details
  platform: Platform;
  handle: string;
  displayName: string;
  profileImageUrl?: string;
  bio?: string;
  niche: AccountNiche;
  niches: AccountNiche[];  // Can have multiple

  // Metrics
  metrics: AccountMetrics;
  metricsVerifiedAt?: string;
  verificationStatus: AccountVerificationStatus;

  // Pricing
  askingPrice: number;
  minimumOffer: number;
  acceptsOffers: boolean;
  pricePerFollower: number;  // Calculated: askingPrice / followers

  // Listing details
  title: string;
  description: string;
  highlights: string[];
  monetization?: {
    hasMonetization: boolean;
    monthlyRevenue?: number;
    revenueSource?: string;
  };

  // Assets included
  assetsIncluded: {
    email: boolean;
    originalEmail: boolean;
    contentLibrary: boolean;
    brandDeals: boolean;
    website: boolean;
    otherSocials: string[];
  };

  // Status
  status: ListingStatus;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;

  // Stats
  views: number;
  saves: number;
  inquiries: number;
  offers: number;
}

// ============================================
// OFFER TYPES
// ============================================

export type OfferStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'countered'
  | 'expired'
  | 'withdrawn'
  | 'completed';

export interface Offer {
  id: string;
  listingId: string;

  // Buyer info
  buyerId: string;
  buyerUsername: string;
  buyerRating: number;

  // Offer details
  amount: number;
  message: string;

  // Status
  status: OfferStatus;

  // Counter offer chain
  previousOfferId?: string;
  counterAmount?: number;
  counterMessage?: string;

  // Timestamps
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
}

// ============================================
// TRANSACTION TYPES
// ============================================

export type TransactionStatus =
  | 'initiated'
  | 'payment_pending'
  | 'payment_received'
  | 'transfer_in_progress'
  | 'verification_pending'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export interface Transaction {
  id: string;
  listingId: string;
  offerId: string;

  // Parties
  sellerId: string;
  buyerId: string;

  // Financials
  salePrice: number;
  platformFee: number;      // Our cut
  processingFee: number;    // Payment processor
  sellerPayout: number;     // What seller receives

  // Status
  status: TransactionStatus;

  // Escrow
  escrowId?: string;
  escrowReleasedAt?: string;

  // Transfer verification
  transferVerified: boolean;
  verificationMethod?: 'manual' | 'api' | 'screenshot';

  // Timestamps
  createdAt: string;
  completedAt?: string;

  // Dispute info
  disputeReason?: string;
  disputeResolution?: string;
}

// ============================================
// FILTERS & SEARCH
// ============================================

export interface MarketFilters {
  platform?: Platform[];
  niche?: AccountNiche[];
  priceMin?: number;
  priceMax?: number;
  followersMin?: number;
  followersMax?: number;
  engagementMin?: number;
  verifiedOnly?: boolean;
  acceptsOffers?: boolean;
  sortBy?: 'newest' | 'price_low' | 'price_high' | 'followers' | 'engagement' | 'popular';
}

// ============================================
// CONFIGURATION
// ============================================

export const MARKET_CONFIG = {
  // Fees
  PLATFORM_FEE_PERCENT: 10,  // We take 10% of sale price
  MINIMUM_LISTING_PRICE: 50,

  // Listing
  LISTING_DURATION_DAYS: 30,
  MAX_IMAGES_PER_LISTING: 10,

  // Offers
  OFFER_EXPIRY_HOURS: 48,
  MIN_OFFER_PERCENT: 50,  // Minimum offer is 50% of asking price

  // Escrow
  ESCROW_HOLD_DAYS: 7,  // Hold period after transfer for verification

  // Verification
  MIN_FOLLOWERS_TO_LIST: 1000,

  // Pricing guidelines (per 1K followers by niche)
  PRICE_PER_1K: {
    lifestyle: { min: 10, max: 30 },
    fashion: { min: 15, max: 50 },
    fitness: { min: 12, max: 40 },
    food: { min: 10, max: 25 },
    travel: { min: 12, max: 35 },
    tech: { min: 15, max: 45 },
    gaming: { min: 8, max: 25 },
    music: { min: 10, max: 30 },
    art: { min: 8, max: 25 },
    business: { min: 20, max: 60 },
    education: { min: 15, max: 40 },
    entertainment: { min: 10, max: 30 },
    sports: { min: 10, max: 30 },
    beauty: { min: 15, max: 50 },
    pets: { min: 8, max: 20 },
    automotive: { min: 12, max: 35 },
    other: { min: 5, max: 20 },
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function calculatePlatformFee(salePrice: number): number {
  return Math.round(salePrice * (MARKET_CONFIG.PLATFORM_FEE_PERCENT / 100) * 100) / 100;
}

export function calculateSellerPayout(salePrice: number): number {
  const platformFee = calculatePlatformFee(salePrice);
  const processingFee = Math.round(salePrice * 0.029 * 100) / 100 + 0.30; // Stripe-like fees
  return Math.round((salePrice - platformFee - processingFee) * 100) / 100;
}

export function estimateAccountValue(
  followers: number,
  engagementRate: number,
  niche: AccountNiche
): { low: number; mid: number; high: number } {
  const priceRange = MARKET_CONFIG.PRICE_PER_1K[niche];
  const followerMultiplier = followers / 1000;

  // Engagement bonus: up to 50% more for high engagement
  const engagementBonus = Math.min(engagementRate / 10, 0.5);

  return {
    low: Math.round(followerMultiplier * priceRange.min * (1 + engagementBonus * 0.5)),
    mid: Math.round(followerMultiplier * ((priceRange.min + priceRange.max) / 2) * (1 + engagementBonus)),
    high: Math.round(followerMultiplier * priceRange.max * (1 + engagementBonus)),
  };
}

export function formatFollowers(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export function getPlatformIcon(platform: Platform): string {
  const icons: Record<Platform, string> = {
    instagram: '📸',
    tiktok: '🎵',
    twitter: '𝕏',
    youtube: '▶️',
    facebook: '📘',
  };
  return icons[platform];
}

export function getNicheLabel(niche: AccountNiche): string {
  const labels: Record<AccountNiche, string> = {
    lifestyle: 'Lifestyle',
    fashion: 'Fashion',
    fitness: 'Fitness & Health',
    food: 'Food & Cooking',
    travel: 'Travel',
    tech: 'Technology',
    gaming: 'Gaming',
    music: 'Music',
    art: 'Art & Design',
    business: 'Business',
    education: 'Education',
    entertainment: 'Entertainment',
    sports: 'Sports',
    beauty: 'Beauty',
    pets: 'Pets & Animals',
    automotive: 'Automotive',
    other: 'Other',
  };
  return labels[niche];
}
