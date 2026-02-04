/**
 * SOCIAL EXCHANGE - MARKET STORE
 * LocalStorage-based marketplace data management
 */

import {
  MarketListing,
  Offer,
  Transaction,
  MarketFilters,
  ListingStatus,
  OfferStatus,
  TransactionStatus,
  Platform,
  AccountNiche,
  MARKET_CONFIG,
  calculatePlatformFee,
  calculateSellerPayout,
} from '../types/market';

const STORAGE_KEYS = {
  LISTINGS: 'sx_market_listings',
  OFFERS: 'sx_market_offers',
  TRANSACTIONS: 'sx_market_transactions',
  SAVED_LISTINGS: 'sx_market_saved',
};

// ============================================
// UTILITIES
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// LISTINGS
// ============================================

export function getListings(): MarketListing[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.LISTINGS);
  return data ? JSON.parse(data) : [];
}

export function saveListings(listings: MarketListing[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
}

export function getListingById(id: string): MarketListing | null {
  const listings = getListings();
  return listings.find(l => l.id === id) || null;
}

export function getActiveListings(filters?: MarketFilters): MarketListing[] {
  let listings = getListings().filter(l => l.status === 'active');

  if (filters) {
    // Platform filter
    if (filters.platform && filters.platform.length > 0) {
      listings = listings.filter(l => filters.platform!.includes(l.platform));
    }

    // Niche filter
    if (filters.niche && filters.niche.length > 0) {
      listings = listings.filter(l =>
        l.niches.some(n => filters.niche!.includes(n))
      );
    }

    // Price filter
    if (filters.priceMin !== undefined) {
      listings = listings.filter(l => l.askingPrice >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      listings = listings.filter(l => l.askingPrice <= filters.priceMax!);
    }

    // Followers filter
    if (filters.followersMin !== undefined) {
      listings = listings.filter(l => l.metrics.followers >= filters.followersMin!);
    }
    if (filters.followersMax !== undefined) {
      listings = listings.filter(l => l.metrics.followers <= filters.followersMax!);
    }

    // Engagement filter
    if (filters.engagementMin !== undefined) {
      listings = listings.filter(l => l.metrics.engagementRate >= filters.engagementMin!);
    }

    // Verified only
    if (filters.verifiedOnly) {
      listings = listings.filter(l => l.verificationStatus === 'verified');
    }

    // Accepts offers
    if (filters.acceptsOffers) {
      listings = listings.filter(l => l.acceptsOffers);
    }

    // Sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'newest':
          listings.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());
          break;
        case 'price_low':
          listings.sort((a, b) => a.askingPrice - b.askingPrice);
          break;
        case 'price_high':
          listings.sort((a, b) => b.askingPrice - a.askingPrice);
          break;
        case 'followers':
          listings.sort((a, b) => b.metrics.followers - a.metrics.followers);
          break;
        case 'engagement':
          listings.sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate);
          break;
        case 'popular':
          listings.sort((a, b) => (b.views + b.saves * 5) - (a.views + a.saves * 5));
          break;
      }
    }
  }

  return listings;
}

export function getListingsBySeller(sellerId: string): MarketListing[] {
  return getListings().filter(l => l.sellerId === sellerId);
}

export function createListing(listing: Omit<MarketListing, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'saves' | 'inquiries' | 'offers'>): MarketListing {
  const now = new Date().toISOString();
  const newListing: MarketListing = {
    ...listing,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
    views: 0,
    saves: 0,
    inquiries: 0,
    offers: 0,
  };

  const listings = getListings();
  listings.push(newListing);
  saveListings(listings);

  return newListing;
}

export function updateListing(id: string, updates: Partial<MarketListing>): MarketListing | null {
  const listings = getListings();
  const index = listings.findIndex(l => l.id === id);

  if (index === -1) return null;

  listings[index] = {
    ...listings[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveListings(listings);
  return listings[index];
}

export function incrementListingViews(id: string): void {
  const listings = getListings();
  const index = listings.findIndex(l => l.id === id);

  if (index !== -1) {
    listings[index].views++;
    saveListings(listings);
  }
}

// ============================================
// OFFERS
// ============================================

export function getOffers(): Offer[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.OFFERS);
  return data ? JSON.parse(data) : [];
}

export function saveOffers(offers: Offer[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(offers));
}

export function getOffersForListing(listingId: string): Offer[] {
  return getOffers().filter(o => o.listingId === listingId);
}

export function getOffersByBuyer(buyerId: string): Offer[] {
  return getOffers().filter(o => o.buyerId === buyerId);
}

export function createOffer(offer: Omit<Offer, 'id' | 'createdAt' | 'expiresAt' | 'status'>): Offer {
  const now = new Date();
  const newOffer: Offer = {
    ...offer,
    id: generateId(),
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + MARKET_CONFIG.OFFER_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
  };

  const offers = getOffers();
  offers.push(newOffer);
  saveOffers(offers);

  // Update listing offer count
  const listings = getListings();
  const listingIndex = listings.findIndex(l => l.id === offer.listingId);
  if (listingIndex !== -1) {
    listings[listingIndex].offers++;
    saveListings(listings);
  }

  return newOffer;
}

export function respondToOffer(
  offerId: string,
  response: 'accepted' | 'rejected' | 'countered',
  counterAmount?: number,
  counterMessage?: string
): Offer | null {
  const offers = getOffers();
  const index = offers.findIndex(o => o.id === offerId);

  if (index === -1) return null;

  offers[index].status = response;
  offers[index].respondedAt = new Date().toISOString();

  if (response === 'countered' && counterAmount) {
    offers[index].counterAmount = counterAmount;
    offers[index].counterMessage = counterMessage;
  }

  saveOffers(offers);

  // If accepted, update listing status
  if (response === 'accepted') {
    updateListing(offers[index].listingId, { status: 'under_offer' });
  }

  return offers[index];
}

// ============================================
// TRANSACTIONS
// ============================================

export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
}

export function saveTransactions(transactions: Transaction[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function createTransaction(listingId: string, offerId: string): Transaction | null {
  const listing = getListingById(listingId);
  const offers = getOffers();
  const offer = offers.find(o => o.id === offerId);

  if (!listing || !offer || offer.status !== 'accepted') return null;

  const salePrice = offer.amount;
  const platformFee = calculatePlatformFee(salePrice);
  const processingFee = Math.round(salePrice * 0.029 * 100) / 100 + 0.30;

  const transaction: Transaction = {
    id: generateId(),
    listingId,
    offerId,
    sellerId: listing.sellerId,
    buyerId: offer.buyerId,
    salePrice,
    platformFee,
    processingFee,
    sellerPayout: calculateSellerPayout(salePrice),
    status: 'initiated',
    transferVerified: false,
    createdAt: new Date().toISOString(),
  };

  const transactions = getTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);

  return transaction;
}

export function updateTransactionStatus(id: string, status: TransactionStatus): Transaction | null {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === id);

  if (index === -1) return null;

  transactions[index].status = status;

  if (status === 'completed') {
    transactions[index].completedAt = new Date().toISOString();
    // Update listing status
    updateListing(transactions[index].listingId, { status: 'sold' });
    // Update offer status
    const offers = getOffers();
    const offerIndex = offers.findIndex(o => o.id === transactions[index].offerId);
    if (offerIndex !== -1) {
      offers[offerIndex].status = 'completed';
      saveOffers(offers);
    }
  }

  saveTransactions(transactions);
  return transactions[index];
}

// ============================================
// SAVED LISTINGS
// ============================================

export function getSavedListings(userId: string): string[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.SAVED_LISTINGS);
  const saved = data ? JSON.parse(data) : {};
  return saved[userId] || [];
}

export function toggleSaveListing(userId: string, listingId: string): boolean {
  if (typeof window === 'undefined') return false;

  const data = localStorage.getItem(STORAGE_KEYS.SAVED_LISTINGS);
  const saved = data ? JSON.parse(data) : {};

  if (!saved[userId]) {
    saved[userId] = [];
  }

  const index = saved[userId].indexOf(listingId);
  const isSaved = index === -1;

  if (isSaved) {
    saved[userId].push(listingId);
    // Update listing saves count
    const listings = getListings();
    const listingIndex = listings.findIndex(l => l.id === listingId);
    if (listingIndex !== -1) {
      listings[listingIndex].saves++;
      saveListings(listings);
    }
  } else {
    saved[userId].splice(index, 1);
  }

  localStorage.setItem(STORAGE_KEYS.SAVED_LISTINGS, JSON.stringify(saved));
  return isSaved;
}

// ============================================
// SEED DATA
// ============================================

export function seedMarketplaceIfEmpty(): void {
  if (typeof window === 'undefined') return;

  const listings = getListings();
  if (listings.length > 0) return;

  const now = new Date().toISOString();

  const sampleListings: MarketListing[] = [
    {
      id: 'listing-001',
      sellerId: 'seller-001',
      sellerUsername: 'digitalassets_pro',
      sellerRating: 4.9,
      sellerTotalSales: 23,
      platform: 'instagram',
      handle: '@urban_lifestyle_daily',
      displayName: 'Urban Lifestyle Daily',
      profileImageUrl: 'https://picsum.photos/seed/urban/200',
      bio: '✨ City vibes & modern living | 📍 NYC | 🏙️ Architecture • Design • Culture',
      niche: 'lifestyle',
      niches: ['lifestyle', 'travel', 'art'],
      metrics: {
        followers: 127000,
        following: 892,
        posts: 1847,
        avgLikes: 4250,
        avgComments: 187,
        engagementRate: 3.49,
        audienceDemo: {
          topCountries: [
            { country: 'United States', percentage: 45 },
            { country: 'United Kingdom', percentage: 12 },
            { country: 'Canada', percentage: 8 },
          ],
          ageRanges: [
            { range: '18-24', percentage: 28 },
            { range: '25-34', percentage: 42 },
            { range: '35-44', percentage: 20 },
          ],
          genderSplit: { male: 35, female: 62, other: 3 },
        },
      },
      metricsVerifiedAt: now,
      verificationStatus: 'verified',
      askingPrice: 3200,
      minimumOffer: 2500,
      acceptsOffers: true,
      pricePerFollower: 0.025,
      title: 'Established Lifestyle Account with Engaged NYC Audience',
      description: 'Premium lifestyle account focused on urban living, architecture, and modern design. Consistently growing with highly engaged audience primarily in major US cities. Perfect for lifestyle brands, real estate, or design companies.',
      highlights: [
        '3.5% engagement rate (above industry average)',
        'Organic growth, never purchased followers',
        '45% US-based audience',
        'Strong 25-34 demographic',
        'Original content library included',
      ],
      monetization: {
        hasMonetization: true,
        monthlyRevenue: 800,
        revenueSource: 'Sponsored posts & affiliate marketing',
      },
      assetsIncluded: {
        email: true,
        originalEmail: true,
        contentLibrary: true,
        brandDeals: false,
        website: false,
        otherSocials: [],
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      views: 342,
      saves: 47,
      inquiries: 12,
      offers: 3,
    },
    {
      id: 'listing-002',
      sellerId: 'seller-002',
      sellerUsername: 'accountflip',
      sellerRating: 4.7,
      sellerTotalSales: 8,
      platform: 'instagram',
      handle: '@fitness_fuel_daily',
      displayName: 'Fitness Fuel',
      profileImageUrl: 'https://picsum.photos/seed/fitness/200',
      bio: '💪 Transform your body | 🥗 Nutrition tips | 🏋️ Home workouts | Free guides 👇',
      niche: 'fitness',
      niches: ['fitness', 'food'],
      metrics: {
        followers: 89500,
        following: 445,
        posts: 923,
        avgLikes: 3890,
        avgComments: 245,
        engagementRate: 4.62,
      },
      metricsVerifiedAt: now,
      verificationStatus: 'verified',
      askingPrice: 2800,
      minimumOffer: 2200,
      acceptsOffers: true,
      pricePerFollower: 0.031,
      title: 'High-Engagement Fitness Account - Perfect for Supplement Brands',
      description: 'Fitness and nutrition account with exceptional engagement. Audience is highly interested in workout programs, supplements, and healthy eating. Great foundation for monetization.',
      highlights: [
        '4.6% engagement rate - exceptional for fitness niche',
        'Strong comment section community',
        'Primarily US audience (52%)',
        'Peak posting times optimized',
        '900+ posts content library',
      ],
      monetization: {
        hasMonetization: false,
      },
      assetsIncluded: {
        email: true,
        originalEmail: false,
        contentLibrary: true,
        brandDeals: false,
        website: false,
        otherSocials: [],
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      views: 567,
      saves: 89,
      inquiries: 24,
      offers: 7,
    },
    {
      id: 'listing-003',
      sellerId: 'seller-003',
      sellerUsername: 'mediamogul',
      sellerRating: 5.0,
      sellerTotalSales: 45,
      platform: 'instagram',
      handle: '@tech_insider_hub',
      displayName: 'Tech Insider',
      profileImageUrl: 'https://picsum.photos/seed/tech/200',
      bio: '🚀 Latest in Tech | 💡 Gadgets & Innovation | 📱 Reviews | 🤖 AI Updates',
      niche: 'tech',
      niches: ['tech', 'business'],
      metrics: {
        followers: 245000,
        following: 312,
        posts: 2156,
        avgLikes: 7800,
        avgComments: 412,
        engagementRate: 3.35,
      },
      metricsVerifiedAt: now,
      verificationStatus: 'verified',
      askingPrice: 8500,
      minimumOffer: 7000,
      acceptsOffers: true,
      pricePerFollower: 0.035,
      title: 'Premium Tech Account - 245K Followers - Monetization Ready',
      description: 'Established tech news and reviews account. Strong authority in the tech space with engaged audience interested in gadgets, software, and innovation. Previously worked with major tech brands.',
      highlights: [
        '245K highly engaged tech enthusiasts',
        'Previous brand deals with Samsung, Anker, Dbrand',
        'Content calendar and posting strategy included',
        'Established relationships with PR agencies',
        'Cross-posting to Twitter included',
      ],
      monetization: {
        hasMonetization: true,
        monthlyRevenue: 2400,
        revenueSource: 'Sponsored reviews & affiliate links',
      },
      assetsIncluded: {
        email: true,
        originalEmail: true,
        contentLibrary: true,
        brandDeals: true,
        website: true,
        otherSocials: ['twitter'],
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      views: 1245,
      saves: 203,
      inquiries: 67,
      offers: 12,
    },
    {
      id: 'listing-004',
      sellerId: 'seller-001',
      sellerUsername: 'digitalassets_pro',
      sellerRating: 4.9,
      sellerTotalSales: 23,
      platform: 'tiktok',
      handle: '@viralclips_central',
      displayName: 'Viral Clips Central',
      profileImageUrl: 'https://picsum.photos/seed/viral/200',
      bio: '😂 Daily entertainment | 🎬 Best clips | 📺 Movies & TV',
      niche: 'entertainment',
      niches: ['entertainment'],
      metrics: {
        followers: 520000,
        following: 89,
        posts: 456,
        avgLikes: 45000,
        avgComments: 890,
        engagementRate: 8.82,
      },
      metricsVerifiedAt: now,
      verificationStatus: 'verified',
      askingPrice: 6500,
      minimumOffer: 5000,
      acceptsOffers: true,
      pricePerFollower: 0.013,
      title: 'Viral TikTok Account - 520K - Entertainment Niche',
      description: 'High-growth entertainment TikTok with consistent viral content. Multiple videos over 1M views. Perfect for content agencies or entertainment brands.',
      highlights: [
        '520K followers with 8.8% engagement',
        '15 videos with 1M+ views',
        'Consistent growth trajectory',
        'TikTok Creator Fund eligible',
        'Established posting strategy',
      ],
      monetization: {
        hasMonetization: true,
        monthlyRevenue: 450,
        revenueSource: 'TikTok Creator Fund',
      },
      assetsIncluded: {
        email: true,
        originalEmail: true,
        contentLibrary: false,
        brandDeals: false,
        website: false,
        otherSocials: [],
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      views: 892,
      saves: 156,
      inquiries: 34,
      offers: 8,
    },
    {
      id: 'listing-005',
      sellerId: 'seller-004',
      sellerUsername: 'accountseller99',
      sellerRating: 4.5,
      sellerTotalSales: 5,
      platform: 'instagram',
      handle: '@minimal_home_inspo',
      displayName: 'Minimal Home',
      profileImageUrl: 'https://picsum.photos/seed/minimal/200',
      bio: '🏠 Minimalist interiors | 🪴 Scandinavian design | ✨ Home decor inspiration',
      niche: 'lifestyle',
      niches: ['lifestyle', 'art'],
      metrics: {
        followers: 34500,
        following: 567,
        posts: 412,
        avgLikes: 1450,
        avgComments: 67,
        engagementRate: 4.40,
      },
      metricsVerifiedAt: now,
      verificationStatus: 'verified',
      askingPrice: 850,
      minimumOffer: 650,
      acceptsOffers: true,
      pricePerFollower: 0.025,
      title: 'Minimalist Home Decor Account - Growing Niche',
      description: 'Beautiful home decor account focused on minimalist and Scandinavian design. Perfect starter account for furniture brands or interior design businesses.',
      highlights: [
        'Highly targeted home decor audience',
        '4.4% engagement rate',
        'Clean aesthetic feed',
        'Growth potential in expanding niche',
      ],
      monetization: {
        hasMonetization: false,
      },
      assetsIncluded: {
        email: true,
        originalEmail: true,
        contentLibrary: true,
        brandDeals: false,
        website: false,
        otherSocials: [],
      },
      status: 'active',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      views: 234,
      saves: 45,
      inquiries: 8,
      offers: 2,
    },
  ];

  saveListings(sampleListings);
  console.log('✅ Marketplace seed data created');
}
