/**
 * SOCIAL EXCHANGE - ESCROW STORE
 * LocalStorage-based escrow transaction management with full audit trail
 */

import {
  EscrowListing,
  EscrowOffer,
  EscrowTransaction,
  EscrowStatus,
  EscrowCredentials,
  StatusHistoryEntry,
  DisputeReason,
  VerificationItem,
  ESCROW_CONFIG,
  VALID_STATUS_TRANSITIONS,
  VERIFICATION_ITEMS,
  calculateFees,
  generateEscrowId,
  generateTransactionId,
  generateOfferId,
  generateListingId,
  addHoursToDate,
  canTransitionTo,
  createVerificationChecklist,
} from '../types/escrow';

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEYS = {
  ESCROW_LISTINGS: 'sx_escrow_listings',
  ESCROW_OFFERS: 'sx_escrow_offers',
  ESCROW_TRANSACTIONS: 'sx_escrow_transactions',
  CURRENT_USER: 'sx_current_user',
};

// ============================================
// STORAGE HELPERS
// ============================================

function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'demo-user';
  return localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'demo-user';
}

// ============================================
// LISTING CRUD OPERATIONS
// ============================================

export function getEscrowListings(): EscrowListing[] {
  return getFromStorage<EscrowListing>(STORAGE_KEYS.ESCROW_LISTINGS);
}

export function saveEscrowListings(listings: EscrowListing[]): void {
  saveToStorage(STORAGE_KEYS.ESCROW_LISTINGS, listings);
}

export function getEscrowListingById(id: string): EscrowListing | null {
  const listings = getEscrowListings();
  return listings.find(l => l.id === id) || null;
}

export function getActiveEscrowListings(): EscrowListing[] {
  return getEscrowListings().filter(l => l.status === 'listed');
}

export function getListingsBySeller(sellerId: string): EscrowListing[] {
  return getEscrowListings().filter(l => l.sellerId === sellerId);
}

export function createEscrowListing(
  listing: Omit<EscrowListing, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'saves' | 'inquiries' | 'totalOffers' | 'status'>
): EscrowListing {
  const now = new Date().toISOString();
  const newListing: EscrowListing = {
    ...listing,
    id: generateListingId(),
    status: 'listed',
    createdAt: now,
    updatedAt: now,
    publishedAt: now,
    expiresAt: addHoursToDate(now, ESCROW_CONFIG.LISTING_DURATION_DAYS * 24),
    views: 0,
    saves: 0,
    inquiries: 0,
    totalOffers: 0,
  };

  const listings = getEscrowListings();
  listings.push(newListing);
  saveEscrowListings(listings);

  return newListing;
}

export function updateEscrowListing(id: string, updates: Partial<EscrowListing>): EscrowListing | null {
  const listings = getEscrowListings();
  const index = listings.findIndex(l => l.id === id);

  if (index === -1) return null;

  listings[index] = {
    ...listings[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveEscrowListings(listings);
  return listings[index];
}

export function updateListingStatus(id: string, newStatus: EscrowStatus): EscrowListing | null {
  const listing = getEscrowListingById(id);
  if (!listing) return null;

  if (!canTransitionTo(listing.status, newStatus)) {
    console.error(`Invalid status transition: ${listing.status} -> ${newStatus}`);
    return null;
  }

  return updateEscrowListing(id, { status: newStatus });
}

// ============================================
// OFFER CRUD OPERATIONS
// ============================================

export function getEscrowOffers(): EscrowOffer[] {
  return getFromStorage<EscrowOffer>(STORAGE_KEYS.ESCROW_OFFERS);
}

export function saveEscrowOffers(offers: EscrowOffer[]): void {
  saveToStorage(STORAGE_KEYS.ESCROW_OFFERS, offers);
}

export function getOffersForListing(listingId: string): EscrowOffer[] {
  return getEscrowOffers().filter(o => o.listingId === listingId);
}

export function getOffersByBuyer(buyerId: string): EscrowOffer[] {
  return getEscrowOffers().filter(o => o.buyerId === buyerId);
}

export function getOfferById(id: string): EscrowOffer | null {
  const offers = getEscrowOffers();
  return offers.find(o => o.id === id) || null;
}

export function createEscrowOffer(
  offer: Omit<EscrowOffer, 'id' | 'createdAt' | 'expiresAt' | 'status' | 'estimatedFees'>
): EscrowOffer {
  const now = new Date();
  const fees = calculateFees(offer.amount);

  const newOffer: EscrowOffer = {
    ...offer,
    id: generateOfferId(),
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt: addHoursToDate(now, ESCROW_CONFIG.OFFER_EXPIRY_HOURS),
    estimatedFees: {
      platformFee: fees.platformFee,
      processingFee: fees.processingFee,
      totalBuyerPays: fees.totalBuyerPays,
      sellerReceives: fees.sellerReceives,
    },
  };

  const offers = getEscrowOffers();
  offers.push(newOffer);
  saveEscrowOffers(offers);

  // Update listing status and offer count
  const listing = getEscrowListingById(offer.listingId);
  if (listing) {
    updateEscrowListing(offer.listingId, {
      status: 'offer_pending',
      totalOffers: listing.totalOffers + 1,
    });
  }

  return newOffer;
}

export function respondToOffer(
  offerId: string,
  response: 'accepted' | 'rejected' | 'countered',
  counterAmount?: number,
  counterMessage?: string
): EscrowOffer | null {
  const offers = getEscrowOffers();
  const index = offers.findIndex(o => o.id === offerId);

  if (index === -1) return null;

  offers[index].status = response;
  offers[index].respondedAt = new Date().toISOString();

  if (response === 'countered' && counterAmount) {
    offers[index].counterAmount = counterAmount;
    offers[index].counterMessage = counterMessage;
    offers[index].counterExpiresAt = addHoursToDate(new Date(), ESCROW_CONFIG.OFFER_EXPIRY_HOURS);
  }

  saveEscrowOffers(offers);

  // If accepted, update listing status
  if (response === 'accepted') {
    updateListingStatus(offers[index].listingId, 'offer_accepted');
  } else if (response === 'rejected') {
    // Check if there are other pending offers
    const otherOffers = getOffersForListing(offers[index].listingId)
      .filter(o => o.id !== offerId && o.status === 'pending');
    if (otherOffers.length === 0) {
      updateListingStatus(offers[index].listingId, 'listed');
    }
  }

  return offers[index];
}

export function withdrawOffer(offerId: string): EscrowOffer | null {
  const offers = getEscrowOffers();
  const index = offers.findIndex(o => o.id === offerId);

  if (index === -1) return null;

  offers[index].status = 'withdrawn';
  saveEscrowOffers(offers);

  return offers[index];
}

// ============================================
// TRANSACTION MANAGEMENT
// ============================================

export function getEscrowTransactions(): EscrowTransaction[] {
  return getFromStorage<EscrowTransaction>(STORAGE_KEYS.ESCROW_TRANSACTIONS);
}

export function saveEscrowTransactions(transactions: EscrowTransaction[]): void {
  saveToStorage(STORAGE_KEYS.ESCROW_TRANSACTIONS, transactions);
}

export function getTransactionById(id: string): EscrowTransaction | null {
  const transactions = getEscrowTransactions();
  return transactions.find(t => t.id === id) || null;
}

export function getTransactionByListingId(listingId: string): EscrowTransaction | null {
  const transactions = getEscrowTransactions();
  return transactions.find(t => t.listingId === listingId) || null;
}

export function getTransactionsByBuyer(buyerId: string): EscrowTransaction[] {
  return getEscrowTransactions().filter(t => t.buyerId === buyerId);
}

export function getTransactionsBySeller(sellerId: string): EscrowTransaction[] {
  return getEscrowTransactions().filter(t => t.sellerId === sellerId);
}

export function createEscrowTransaction(listingId: string, offerId: string): EscrowTransaction | null {
  const listing = getEscrowListingById(listingId);
  const offer = getOfferById(offerId);

  if (!listing || !offer || offer.status !== 'accepted') return null;

  const fees = calculateFees(offer.amount);
  const now = new Date().toISOString();

  const transaction: EscrowTransaction = {
    id: generateTransactionId(),
    listingId,
    offerId,
    sellerId: listing.sellerId,
    sellerUsername: listing.sellerUsername,
    buyerId: offer.buyerId,
    buyerUsername: offer.buyerUsername,
    salePrice: offer.amount,
    platformFee: fees.platformFee,
    processingFee: fees.processingFee,
    escrowFee: fees.escrowFee,
    totalBuyerPaid: fees.totalBuyerPays,
    sellerPayout: fees.sellerReceives,
    escrowId: generateEscrowId(),
    status: 'offer_accepted',
    statusHistory: [
      {
        status: 'offer_accepted',
        timestamp: now,
        actor: 'system',
        note: 'Transaction created after offer acceptance',
      },
    ],
    verification: {
      started: false,
      completed: false,
      checklist: createVerificationChecklist(),
      allItemsChecked: false,
    },
    createdAt: now,
    updatedAt: now,
    paymentDeadline: addHoursToDate(now, ESCROW_CONFIG.PAYMENT_WINDOW_HOURS),
  };

  const transactions = getEscrowTransactions();
  transactions.push(transaction);
  saveEscrowTransactions(transactions);

  return transaction;
}

// ============================================
// STATUS TRANSITION WITH AUDIT TRAIL
// ============================================

export function transitionTransactionStatus(
  transactionId: string,
  newStatus: EscrowStatus,
  actor: 'buyer' | 'seller' | 'system' | 'admin',
  note?: string,
  metadata?: Record<string, unknown>
): EscrowTransaction | null {
  const transactions = getEscrowTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1) return null;

  const transaction = transactions[index];

  // Validate transition
  if (!canTransitionTo(transaction.status, newStatus)) {
    console.error(`Invalid status transition: ${transaction.status} -> ${newStatus}`);
    return null;
  }

  const now = new Date().toISOString();

  // Create history entry
  const historyEntry: StatusHistoryEntry = {
    status: newStatus,
    timestamp: now,
    actor,
    note,
    metadata,
  };

  // Update transaction
  transactions[index] = {
    ...transaction,
    status: newStatus,
    statusHistory: [...transaction.statusHistory, historyEntry],
    updatedAt: now,
  };

  // Set appropriate deadlines based on new status
  if (newStatus === 'funds_held') {
    transactions[index].escrowHeldAt = now;
    transactions[index].credentialDeadline = addHoursToDate(now, ESCROW_CONFIG.CREDENTIAL_SEND_HOURS);
  } else if (newStatus === 'credentials_sent') {
    transactions[index].verificationDeadline = addHoursToDate(now, ESCROW_CONFIG.VERIFICATION_PERIOD_HOURS);
  } else if (newStatus === 'completed') {
    transactions[index].completedAt = now;
    transactions[index].escrowReleasedAt = now;
  } else if (newStatus === 'refunded') {
    transactions[index].escrowRefundedAt = now;
  }

  saveEscrowTransactions(transactions);

  // Update listing status accordingly
  if (newStatus === 'completed' || newStatus === 'resolved') {
    updateEscrowListing(transaction.listingId, { status: newStatus });
  }

  return transactions[index];
}

// ============================================
// CREDENTIAL HANDLING
// ============================================

export function sendCredentials(
  transactionId: string,
  credentials: Omit<EscrowCredentials, 'sentAt' | 'viewedCount'>
): EscrowTransaction | null {
  const transactions = getEscrowTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1) return null;

  const transaction = transactions[index];

  if (transaction.status !== 'funds_held') {
    console.error('Cannot send credentials: funds not held');
    return null;
  }

  const now = new Date().toISOString();

  transactions[index].credentials = {
    ...credentials,
    sentAt: now,
    viewedCount: 0,
  };

  saveEscrowTransactions(transactions);

  // Transition to credentials_sent
  return transitionTransactionStatus(transactionId, 'credentials_sent', 'seller', 'Credentials sent to buyer');
}

export function viewCredentials(transactionId: string): EscrowCredentials | null {
  const transactions = getEscrowTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1 || !transactions[index].credentials) return null;

  const creds = transactions[index].credentials!;

  if (creds.viewedCount >= ESCROW_CONFIG.MAX_CREDENTIAL_VIEWS) {
    console.error('Maximum credential views exceeded');
    return null;
  }

  // Update view count
  transactions[index].credentials = {
    ...creds,
    viewedAt: new Date().toISOString(),
    viewedCount: creds.viewedCount + 1,
  };

  saveEscrowTransactions(transactions);

  return transactions[index].credentials!;
}

// ============================================
// VERIFICATION HANDLING
// ============================================

export function startVerification(transactionId: string): EscrowTransaction | null {
  const transactions = getEscrowTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1) return null;

  transactions[index].verification.started = true;
  transactions[index].verification.startedAt = new Date().toISOString();

  saveEscrowTransactions(transactions);

  return transitionTransactionStatus(transactionId, 'verification_pending', 'buyer', 'Buyer started verification');
}

export function updateVerificationItem(
  transactionId: string,
  itemId: string,
  checked: boolean,
  notes?: string
): EscrowTransaction | null {
  const transactions = getEscrowTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1) return null;

  const checklist = transactions[index].verification.checklist;
  const itemIndex = checklist.findIndex(item => item.id === itemId);

  if (itemIndex === -1) return null;

  checklist[itemIndex] = {
    ...checklist[itemIndex],
    checked,
    checkedAt: checked ? new Date().toISOString() : undefined,
    notes,
  };

  // Check if all required items are checked
  const allRequiredChecked = checklist
    .filter(item => item.required)
    .every(item => item.checked);

  transactions[index].verification.checklist = checklist;
  transactions[index].verification.allItemsChecked = allRequiredChecked;

  saveEscrowTransactions(transactions);

  return transactions[index];
}

export function completeVerification(transactionId: string): EscrowTransaction | null {
  const transaction = getTransactionById(transactionId);

  if (!transaction) return null;

  if (!transaction.verification.allItemsChecked) {
    console.error('Cannot complete verification: not all required items checked');
    return null;
  }

  const transactions = getEscrowTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  transactions[index].verification.completed = true;
  transactions[index].verification.completedAt = new Date().toISOString();

  saveEscrowTransactions(transactions);

  return transitionTransactionStatus(transactionId, 'completed', 'buyer', 'Buyer completed verification');
}

// ============================================
// DISPUTE HANDLING
// ============================================

export function raiseDispute(
  transactionId: string,
  reason: DisputeReason,
  description: string,
  raisedBy: 'buyer' | 'seller'
): EscrowTransaction | null {
  const transactions = getEscrowTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1) return null;

  const transaction = transactions[index];

  if (!canTransitionTo(transaction.status, 'disputed')) {
    console.error('Cannot raise dispute at current status');
    return null;
  }

  transactions[index].dispute = {
    reason,
    description,
    evidence: [],
    raisedBy,
    raisedAt: new Date().toISOString(),
  };

  saveEscrowTransactions(transactions);

  return transitionTransactionStatus(
    transactionId,
    'disputed',
    raisedBy,
    `Dispute raised: ${reason}`
  );
}

export function addDisputeEvidence(transactionId: string, evidence: string): EscrowTransaction | null {
  const transactions = getEscrowTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1 || !transactions[index].dispute) return null;

  transactions[index].dispute!.evidence.push(evidence);
  transactions[index].updatedAt = new Date().toISOString();

  saveEscrowTransactions(transactions);

  return transactions[index];
}

export function resolveDispute(
  transactionId: string,
  outcome: 'buyer_favor' | 'seller_favor' | 'split' | 'cancelled',
  resolution: string,
  resolvedBy: string
): EscrowTransaction | null {
  const transactions = getEscrowTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);

  if (index === -1 || !transactions[index].dispute) return null;

  const now = new Date().toISOString();

  transactions[index].dispute = {
    ...transactions[index].dispute!,
    resolution,
    resolvedAt: now,
    resolvedBy,
    outcome,
  };

  saveEscrowTransactions(transactions);

  // Determine final status based on outcome
  let finalStatus: EscrowStatus = 'resolved';
  if (outcome === 'buyer_favor' || outcome === 'cancelled') {
    finalStatus = 'refunded';
  } else if (outcome === 'seller_favor') {
    finalStatus = 'completed';
  }

  return transitionTransactionStatus(
    transactionId,
    finalStatus,
    'admin',
    `Dispute resolved: ${outcome}`
  );
}

// ============================================
// AUTO-EXPIRY CHECK
// ============================================

export function checkAndExpireStaleItems(): void {
  const now = new Date();

  // Expire stale offers
  const offers = getEscrowOffers();
  let offersUpdated = false;
  offers.forEach((offer, index) => {
    if (offer.status === 'pending' && new Date(offer.expiresAt) < now) {
      offers[index].status = 'expired';
      offersUpdated = true;
    }
  });
  if (offersUpdated) saveEscrowOffers(offers);

  // Check transactions for deadline violations
  const transactions = getEscrowTransactions();
  transactions.forEach(transaction => {
    // Payment deadline
    if (
      transaction.status === 'offer_accepted' &&
      transaction.paymentDeadline &&
      new Date(transaction.paymentDeadline) < now
    ) {
      transitionTransactionStatus(transaction.id, 'expired', 'system', 'Payment deadline exceeded');
    }

    // Credential deadline
    if (
      transaction.status === 'funds_held' &&
      transaction.credentialDeadline &&
      new Date(transaction.credentialDeadline) < now
    ) {
      transitionTransactionStatus(transaction.id, 'disputed', 'system', 'Seller failed to send credentials within deadline');
    }

    // Verification deadline - auto-complete
    if (
      (transaction.status === 'credentials_sent' || transaction.status === 'verification_pending') &&
      transaction.verificationDeadline &&
      new Date(transaction.verificationDeadline) < now
    ) {
      transitionTransactionStatus(transaction.id, 'completed', 'system', 'Verification period ended - auto-completed');
    }
  });
}

// ============================================
// SEED DATA FOR DEMO
// ============================================

export function seedEscrowDataIfEmpty(): void {
  if (typeof window === 'undefined') return;

  const listings = getEscrowListings();
  if (listings.length > 0) return;

  const now = new Date().toISOString();

  const sampleListings: EscrowListing[] = [
    {
      id: 'LST-DEMO-001',
      sellerId: 'seller-001',
      sellerUsername: 'verified_seller',
      sellerEmail: 'seller@example.com',
      sellerRating: 4.9,
      sellerCompletedSales: 23,
      sellerVerified: true,
      platform: 'instagram',
      handle: '@lifestyle_hub',
      displayName: 'Lifestyle Hub',
      profileImageUrl: 'https://picsum.photos/seed/lifestyle/200',
      bio: 'Premium lifestyle content for modern living',
      niche: 'lifestyle',
      niches: ['lifestyle', 'travel'],
      accountAge: '3 years 2 months',
      metrics: {
        followers: 127000,
        following: 892,
        posts: 1847,
        avgLikes: 4250,
        avgComments: 187,
        engagementRate: 3.49,
      },
      metricsVerifiedAt: now,
      metricsVerificationMethod: 'api',
      askingPrice: 3200,
      minimumOffer: 2500,
      acceptsOffers: true,
      buyNowEnabled: true,
      buyNowPrice: 3500,
      title: 'Established Lifestyle Account - 127K Engaged Followers',
      description: 'Premium lifestyle account with organic growth and highly engaged audience.',
      highlights: [
        '3.5% engagement rate',
        'Organic growth only',
        '45% US audience',
        'Content library included',
      ],
      monetization: {
        hasMonetization: true,
        monthlyRevenue: 800,
        revenueSource: 'Sponsored posts & affiliates',
        revenueProofProvided: true,
      },
      assetsIncluded: {
        email: true,
        originalEmail: true,
        contentLibrary: true,
        brandDeals: false,
        website: false,
        otherSocials: [],
      },
      status: 'listed',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      expiresAt: addHoursToDate(now, 30 * 24),
      views: 342,
      saves: 47,
      inquiries: 12,
      totalOffers: 3,
      termsAccepted: true,
      termsAcceptedAt: now,
    },
    {
      id: 'LST-DEMO-002',
      sellerId: 'seller-002',
      sellerUsername: 'account_flipper',
      sellerEmail: 'flipper@example.com',
      sellerRating: 4.7,
      sellerCompletedSales: 15,
      sellerVerified: true,
      platform: 'instagram',
      handle: '@fitness_daily',
      displayName: 'Fitness Daily',
      profileImageUrl: 'https://picsum.photos/seed/fitness/200',
      bio: 'Your daily dose of fitness motivation',
      niche: 'fitness',
      niches: ['fitness', 'food'],
      accountAge: '2 years 8 months',
      metrics: {
        followers: 89500,
        following: 445,
        posts: 923,
        avgLikes: 3890,
        avgComments: 245,
        engagementRate: 4.62,
      },
      metricsVerifiedAt: now,
      metricsVerificationMethod: 'screenshot',
      askingPrice: 2800,
      minimumOffer: 2200,
      acceptsOffers: true,
      buyNowEnabled: false,
      title: 'High-Engagement Fitness Account',
      description: 'Fitness and nutrition account with exceptional engagement rates.',
      highlights: [
        '4.6% engagement rate',
        'Strong community',
        'US/UK audience',
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
      status: 'listed',
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
      expiresAt: addHoursToDate(now, 30 * 24),
      views: 567,
      saves: 89,
      inquiries: 24,
      totalOffers: 7,
      termsAccepted: true,
      termsAcceptedAt: now,
    },
  ];

  saveEscrowListings(sampleListings);
  console.log('Escrow demo data seeded');
}
