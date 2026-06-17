/**
 * SOCIAL EXCHANGE - MARKETPLACE API CLIENT
 * Replaces all localStorage market-store calls with real API calls.
 */

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface ApiListing {
  id: string;
  title: string;
  description?: string;
  platform: string;
  handle: string;
  profileUrl?: string;
  followers: number;
  following?: number;
  postsCount?: number;
  engagementRate?: number;
  avgLikesPerPost?: number;
  avgCommentsPerPost?: number;
  niche?: string;
  contentCategory?: string;
  price: number;
  proofUrls: string[];
  status: string;
  saleStatus: string;
  sellerId: string;
  seller?: { name?: string; email?: string };
  views: number;
  viewCount: number; // alias
  createdAt: string;
  updatedAt: string;
}

export interface ApiListingsResponse {
  listings: ApiListing[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiWallet {
  id: string;
  balance: number;
  lockedBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalTradingVolume: number;
}

export interface ApiWalletTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
}

export interface ApiWalletResponse {
  wallet: ApiWallet;
  recentTransactions: ApiWalletTransaction[];
}

export interface ApiEscrow {
  id: string;
  status: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amount: number;
  platformFee: number;
  sellerPayout: number;
  createdAt: string;
  updatedAt: string;
  listing?: ApiListing;
}

export interface ListingFilters {
  platform?: string;
  niche?: string;
  minFollowers?: number;
  maxFollowers?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CreateListingInput {
  title: string;
  description?: string;
  platform: string;
  handle: string;
  profileUrl?: string;
  followers: number;
  following?: number;
  postsCount?: number;
  engagementRate?: number;
  avgLikesPerPost?: number;
  avgCommentsPerPost?: number;
  niche?: string;
  contentCategory?: string;
  price: number;
  proofUrls?: string[];
}

// ─────────────────────────────────────────────
// NORMALIZER — coerce Prisma Decimal strings to numbers
// ─────────────────────────────────────────────

function normalizeListing(l: any): ApiListing {
  return {
    ...l,
    price: Number(l.price ?? 0),
    engagementRate: l.engagementRate != null ? Number(l.engagementRate) : undefined,
    views: l.views ?? 0,
    viewCount: l.views ?? 0,
  };
}

// ─────────────────────────────────────────────
// LISTINGS
// ─────────────────────────────────────────────

export async function fetchListings(filters: ListingFilters = {}): Promise<ApiListingsResponse> {
  const params = new URLSearchParams();
  params.set('status', 'ACTIVE');
  params.set('saleStatus', 'AVAILABLE');
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.niche) params.set('niche', filters.niche);
  if (filters.minFollowers != null) params.set('minFollowers', String(filters.minFollowers));
  if (filters.maxFollowers != null) params.set('maxFollowers', String(filters.maxFollowers));
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  params.set('limit', String(filters.limit ?? 20));
  params.set('offset', String(filters.offset ?? 0));

  const res = await fetch(`/api/marketplace/listings?${params}`);
  if (!res.ok) throw new Error('Failed to fetch listings');
  const data = await res.json();
  return { ...data, listings: (data.listings ?? []).map(normalizeListing) };
}

export async function fetchListing(id: string): Promise<ApiListing> {
  const res = await fetch(`/api/marketplace/listings/${id}`);
  if (!res.ok) throw new Error('Listing not found');
  return normalizeListing(await res.json());
}

export async function createListing(input: CreateListingInput): Promise<ApiListing> {
  const res = await fetch('/api/marketplace/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create listing');
  }
  return normalizeListing(await res.json());
}

export async function fetchMyListings(): Promise<ApiListing[]> {
  const res = await fetch('/api/marketplace/listings?mine=true');
  if (!res.ok) return [];
  const data = await res.json();
  return (data.listings ?? []).map(normalizeListing);
}

// ─────────────────────────────────────────────
// PURCHASE / ESCROW
// ─────────────────────────────────────────────

export async function purchaseListing(listingId: string): Promise<ApiEscrow> {
  const res = await fetch('/api/marketplace/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ listingId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to initiate purchase');
  }
  return res.json();
}

export async function fetchEscrow(id: string): Promise<ApiEscrow> {
  const res = await fetch(`/api/marketplace/escrow/${id}`);
  if (!res.ok) throw new Error('Escrow not found');
  return res.json();
}

export async function fetchMyEscrows(): Promise<ApiEscrow[]> {
  const res = await fetch('/api/marketplace/escrow/mine').catch(() => null);
  if (!res || !res.ok) return [];
  return res.json();
}

// ─────────────────────────────────────────────
// WALLET
// ─────────────────────────────────────────────

export async function fetchWallet(): Promise<ApiWalletResponse> {
  const res = await fetch('/api/wallet/balance');
  if (!res.ok) throw new Error('Failed to fetch wallet');
  return res.json();
}

// ─────────────────────────────────────────────
// STRIPE DEPOSIT
// ─────────────────────────────────────────────

export async function createDepositSession(amountUsd: number, userId: string): Promise<{ sessionId: string; url: string }> {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amountUsd, userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create deposit session');
  }
  return res.json();
}
