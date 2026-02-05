/**
 * SOCIAL EXCHANGE - ESCROW SYSTEM TYPES
 * Complete type definitions for secure digital asset transfers
 */

import { Platform, AccountNiche, AccountMetrics } from './market';

// ============================================
// ESCROW STATUS DEFINITIONS
// ============================================

export type EscrowStatus =
  | 'listed'
  | 'offer_pending'
  | 'offer_accepted'
  | 'payment_pending'
  | 'funds_held'
  | 'credentials_sent'
  | 'verification_pending'
  | 'completed'
  | 'disputed'
  | 'resolved'
  | 'refunded'
  | 'cancelled'
  | 'expired';

export interface EscrowStatusInfo {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  step: number;
  buyerActions: string[];
  sellerActions: string[];
  timeoutHours: number | null;
  timeoutAction: EscrowStatus | null;
}

export const ESCROW_STATUS_INFO: Record<EscrowStatus, EscrowStatusInfo> = {
  listed: {
    label: 'Listed',
    description: 'Account is available for purchase',
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.1)',
    step: 0,
    buyerActions: ['make_offer', 'buy_now'],
    sellerActions: ['edit_listing', 'withdraw_listing'],
    timeoutHours: null,
    timeoutAction: null,
  },
  offer_pending: {
    label: 'Offer Pending',
    description: 'Waiting for seller to respond to offer',
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    step: 1,
    buyerActions: ['withdraw_offer'],
    sellerActions: ['accept_offer', 'reject_offer', 'counter_offer'],
    timeoutHours: 48,
    timeoutAction: 'expired',
  },
  offer_accepted: {
    label: 'Offer Accepted',
    description: 'Awaiting buyer payment',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
    step: 2,
    buyerActions: ['submit_payment'],
    sellerActions: [],
    timeoutHours: 24,
    timeoutAction: 'expired',
  },
  payment_pending: {
    label: 'Payment Processing',
    description: 'Payment is being processed',
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    step: 2,
    buyerActions: [],
    sellerActions: [],
    timeoutHours: 1,
    timeoutAction: 'offer_accepted',
  },
  funds_held: {
    label: 'Funds Secured',
    description: 'Payment received - awaiting credential transfer',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
    step: 3,
    buyerActions: [],
    sellerActions: ['send_credentials'],
    timeoutHours: 24,
    timeoutAction: 'disputed',
  },
  credentials_sent: {
    label: 'Credentials Sent',
    description: 'Buyer should verify account access',
    color: '#00d4ff',
    bgColor: 'rgba(0, 212, 255, 0.1)',
    step: 4,
    buyerActions: ['verify_access', 'raise_dispute'],
    sellerActions: ['view_sent_credentials'],
    timeoutHours: 168,
    timeoutAction: 'completed',
  },
  verification_pending: {
    label: 'Verification In Progress',
    description: 'Buyer is verifying account access and details',
    color: '#ffd700',
    bgColor: 'rgba(255, 215, 0, 0.1)',
    step: 4,
    buyerActions: ['complete_verification', 'raise_dispute'],
    sellerActions: [],
    timeoutHours: 168,
    timeoutAction: 'completed',
  },
  completed: {
    label: 'Completed',
    description: 'Transaction successful - funds released to seller',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
    step: 5,
    buyerActions: ['leave_review'],
    sellerActions: ['leave_review'],
    timeoutHours: null,
    timeoutAction: null,
  },
  disputed: {
    label: 'Disputed',
    description: 'Issue raised - under platform review',
    color: '#ff4444',
    bgColor: 'rgba(255, 68, 68, 0.1)',
    step: -1,
    buyerActions: ['provide_evidence', 'cancel_dispute'],
    sellerActions: ['provide_evidence', 'offer_resolution'],
    timeoutHours: 72,
    timeoutAction: null,
  },
  resolved: {
    label: 'Resolved',
    description: 'Dispute has been resolved',
    color: '#00ff88',
    bgColor: 'rgba(0, 255, 136, 0.1)',
    step: 5,
    buyerActions: [],
    sellerActions: [],
    timeoutHours: null,
    timeoutAction: null,
  },
  refunded: {
    label: 'Refunded',
    description: 'Funds returned to buyer',
    color: '#ff8800',
    bgColor: 'rgba(255, 136, 0, 0.1)',
    step: -1,
    buyerActions: [],
    sellerActions: [],
    timeoutHours: null,
    timeoutAction: null,
  },
  cancelled: {
    label: 'Cancelled',
    description: 'Transaction was cancelled',
    color: '#888888',
    bgColor: 'rgba(136, 136, 136, 0.1)',
    step: -1,
    buyerActions: [],
    sellerActions: [],
    timeoutHours: null,
    timeoutAction: null,
  },
  expired: {
    label: 'Expired',
    description: 'Transaction timed out',
    color: '#888888',
    bgColor: 'rgba(136, 136, 136, 0.1)',
    step: -1,
    buyerActions: [],
    sellerActions: [],
    timeoutHours: null,
    timeoutAction: null,
  },
};

// ============================================
// STATE MACHINE - VALID TRANSITIONS
// ============================================

export const VALID_STATUS_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  listed: ['offer_pending', 'cancelled'],
  offer_pending: ['offer_accepted', 'listed', 'expired', 'cancelled'],
  offer_accepted: ['payment_pending', 'expired', 'cancelled'],
  payment_pending: ['funds_held', 'offer_accepted', 'cancelled'],
  funds_held: ['credentials_sent', 'disputed', 'refunded'],
  credentials_sent: ['verification_pending', 'completed', 'disputed'],
  verification_pending: ['completed', 'disputed'],
  completed: [],
  disputed: ['resolved', 'refunded', 'completed'],
  resolved: [],
  refunded: [],
  cancelled: [],
  expired: [],
};

export function canTransitionTo(current: EscrowStatus, next: EscrowStatus): boolean {
  return VALID_STATUS_TRANSITIONS[current].includes(next);
}

export function getValidTransitions(current: EscrowStatus): EscrowStatus[] {
  return VALID_STATUS_TRANSITIONS[current];
}

// ============================================
// ESCROW STEPS FOR PROGRESS INDICATOR
// ============================================

export interface EscrowStep {
  id: number;
  label: string;
  shortLabel: string;
  description: string;
  statuses: EscrowStatus[];
}

export const ESCROW_STEPS: EscrowStep[] = [
  {
    id: 1,
    label: 'Listing & Offers',
    shortLabel: 'Offer',
    description: 'Account listed, offers negotiated',
    statuses: ['listed', 'offer_pending'],
  },
  {
    id: 2,
    label: 'Payment',
    shortLabel: 'Pay',
    description: 'Buyer submits payment',
    statuses: ['offer_accepted', 'payment_pending'],
  },
  {
    id: 3,
    label: 'Escrow Hold',
    shortLabel: 'Hold',
    description: 'Funds secured by platform',
    statuses: ['funds_held'],
  },
  {
    id: 4,
    label: 'Transfer',
    shortLabel: 'Transfer',
    description: 'Credentials sent, buyer verifies',
    statuses: ['credentials_sent', 'verification_pending'],
  },
  {
    id: 5,
    label: 'Complete',
    shortLabel: 'Done',
    description: 'Funds released to seller',
    statuses: ['completed', 'resolved'],
  },
];

export function getCurrentStep(status: EscrowStatus): number {
  const step = ESCROW_STEPS.find(s => s.statuses.includes(status));
  return step ? step.id : 0;
}

// ============================================
// ESCROW LISTING INTERFACE
// ============================================

export interface EscrowListing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  sellerEmail: string;
  sellerRating: number;
  sellerCompletedSales: number;
  sellerVerified: boolean;
  platform: Platform;
  handle: string;
  displayName: string;
  profileImageUrl?: string;
  bio?: string;
  niche: AccountNiche;
  niches: AccountNiche[];
  accountAge: string;
  accountCreatedAt?: string;
  metrics: AccountMetrics;
  metricsVerifiedAt?: string;
  metricsVerificationMethod?: 'api' | 'screenshot' | 'manual';
  askingPrice: number;
  minimumOffer: number;
  acceptsOffers: boolean;
  buyNowEnabled: boolean;
  buyNowPrice?: number;
  title: string;
  description: string;
  highlights: string[];
  monetization: {
    hasMonetization: boolean;
    monthlyRevenue?: number;
    revenueSource?: string;
    revenueProofProvided?: boolean;
  };
  assetsIncluded: {
    email: boolean;
    originalEmail: boolean;
    contentLibrary: boolean;
    brandDeals: boolean;
    website: boolean;
    websiteUrl?: string;
    domain?: string;
    otherSocials: string[];
    additionalAssets?: string[];
  };
  status: EscrowStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  views: number;
  saves: number;
  inquiries: number;
  totalOffers: number;
  termsAccepted: boolean;
  termsAcceptedAt?: string;
}

// ============================================
// ESCROW OFFER INTERFACE
// ============================================

export interface EscrowOffer {
  id: string;
  listingId: string;
  buyerId: string;
  buyerUsername: string;
  buyerEmail: string;
  buyerRating: number;
  buyerCompletedPurchases: number;
  buyerVerified: boolean;
  amount: number;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'withdrawn';
  previousOfferId?: string;
  counterAmount?: number;
  counterMessage?: string;
  counterExpiresAt?: string;
  createdAt: string;
  expiresAt: string;
  respondedAt?: string;
  estimatedFees: {
    platformFee: number;
    processingFee: number;
    totalBuyerPays: number;
    sellerReceives: number;
  };
}

// ============================================
// ESCROW TRANSACTION INTERFACE
// ============================================

export interface StatusHistoryEntry {
  status: EscrowStatus;
  timestamp: string;
  actor: 'buyer' | 'seller' | 'system' | 'admin';
  actorId?: string;
  note?: string;
  metadata?: Record<string, unknown>;
}

export interface EscrowCredentials {
  email?: string;
  password?: string;
  twoFactorMethod?: 'app' | 'sms' | 'email' | 'none';
  twoFactorBackupCodes?: string[];
  additionalNotes?: string;
  sentAt: string;
  viewedAt?: string;
  viewedCount: number;
}

export interface VerificationItem {
  id: string;
  label: string;
  description: string;
  required: boolean;
  checked: boolean;
  checkedAt?: string;
  notes?: string;
}

export interface DisputeInfo {
  reason: DisputeReason;
  description: string;
  evidence: string[];
  raisedBy: 'buyer' | 'seller';
  raisedAt: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  outcome?: 'buyer_favor' | 'seller_favor' | 'split' | 'cancelled';
}

export interface EscrowTransaction {
  id: string;
  listingId: string;
  offerId: string;
  sellerId: string;
  sellerUsername: string;
  buyerId: string;
  buyerUsername: string;
  salePrice: number;
  platformFee: number;
  processingFee: number;
  escrowFee: number;
  totalBuyerPaid: number;
  sellerPayout: number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentReceivedAt?: string;
  escrowId: string;
  escrowHeldAt?: string;
  escrowReleasedAt?: string;
  escrowRefundedAt?: string;
  status: EscrowStatus;
  statusHistory: StatusHistoryEntry[];
  credentials?: EscrowCredentials;
  verification: {
    started: boolean;
    startedAt?: string;
    completed: boolean;
    completedAt?: string;
    checklist: VerificationItem[];
    allItemsChecked: boolean;
  };
  dispute?: DisputeInfo;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  paymentDeadline?: string;
  credentialDeadline?: string;
  verificationDeadline?: string;
}

// ============================================
// DISPUTE TYPES
// ============================================

export type DisputeReason =
  | 'credentials_invalid'
  | 'account_not_as_described'
  | 'metrics_misrepresented'
  | 'cannot_access_account'
  | 'account_banned'
  | 'content_missing'
  | 'email_not_provided'
  | 'unauthorized_changes'
  | 'seller_unresponsive'
  | 'other';

export const DISPUTE_REASONS: Record<DisputeReason, { label: string; description: string; severity: 'low' | 'medium' | 'high' }> = {
  credentials_invalid: {
    label: 'Invalid Credentials',
    description: 'The login credentials provided do not work',
    severity: 'high',
  },
  account_not_as_described: {
    label: 'Account Not As Described',
    description: 'The account differs significantly from the listing',
    severity: 'high',
  },
  metrics_misrepresented: {
    label: 'Metrics Misrepresented',
    description: 'Follower count or engagement differs from listing',
    severity: 'medium',
  },
  cannot_access_account: {
    label: 'Cannot Access Account',
    description: 'Unable to log in or access account features',
    severity: 'high',
  },
  account_banned: {
    label: 'Account Banned/Suspended',
    description: 'The account has been banned or suspended',
    severity: 'high',
  },
  content_missing: {
    label: 'Content Missing',
    description: 'Previously shown content is no longer available',
    severity: 'medium',
  },
  email_not_provided: {
    label: 'Email Not Provided',
    description: 'Original email access was promised but not delivered',
    severity: 'medium',
  },
  unauthorized_changes: {
    label: 'Unauthorized Changes',
    description: 'Seller made changes to account after sale',
    severity: 'high',
  },
  seller_unresponsive: {
    label: 'Seller Unresponsive',
    description: 'Seller is not responding to messages',
    severity: 'medium',
  },
  other: {
    label: 'Other Issue',
    description: 'Another issue not listed above',
    severity: 'low',
  },
};

// ============================================
// VERIFICATION CHECKLIST
// ============================================

export const VERIFICATION_ITEMS: Omit<VerificationItem, 'checked' | 'checkedAt' | 'notes'>[] = [
  {
    id: 'can_login',
    label: 'Can Log In',
    description: 'Successfully logged into the account with provided credentials',
    required: true,
  },
  {
    id: 'profile_matches',
    label: 'Profile Matches',
    description: 'Profile picture, bio, and display name match the listing',
    required: true,
  },
  {
    id: 'followers_match',
    label: 'Followers Match',
    description: 'Follower count is within 5% of the listed amount',
    required: true,
  },
  {
    id: 'content_intact',
    label: 'Content Intact',
    description: 'All posts and content are still present',
    required: true,
  },
  {
    id: 'email_access',
    label: 'Email Access',
    description: 'Can access the associated email account (if included)',
    required: false,
  },
  {
    id: 'no_unauthorized_access',
    label: 'No Unauthorized Access',
    description: 'Changed password and secured account from previous owner',
    required: true,
  },
];

export function createVerificationChecklist(): VerificationItem[] {
  return VERIFICATION_ITEMS.map(item => ({
    ...item,
    checked: false,
  }));
}

// ============================================
// ESCROW CONFIGURATION
// ============================================

export const ESCROW_CONFIG = {
  PLATFORM_FEE_PERCENT: 10,
  ESCROW_FEE_PERCENT: 2.5,
  PROCESSING_FEE_PERCENT: 2.9,
  PROCESSING_FEE_FIXED: 0.30,
  MINIMUM_LISTING_PRICE: 50,
  MINIMUM_OFFER_PERCENT: 50,
  OFFER_EXPIRY_HOURS: 48,
  PAYMENT_WINDOW_HOURS: 24,
  CREDENTIAL_SEND_HOURS: 24,
  VERIFICATION_PERIOD_HOURS: 168,
  DISPUTE_RESOLUTION_HOURS: 72,
  MAX_ACTIVE_OFFERS_PER_LISTING: 10,
  MAX_COUNTER_OFFERS: 5,
  MAX_CREDENTIAL_VIEWS: 5,
  FOLLOWER_VARIANCE_THRESHOLD: 0.05,
  LISTING_DURATION_DAYS: 30,
} as const;

// ============================================
// FEE CALCULATION FUNCTIONS
// ============================================

export interface FeeBreakdown {
  salePrice: number;
  platformFee: number;
  escrowFee: number;
  processingFee: number;
  totalFees: number;
  totalBuyerPays: number;
  sellerReceives: number;
}

export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculateFees(salePrice: number): FeeBreakdown {
  const platformFee = roundCurrency(salePrice * (ESCROW_CONFIG.PLATFORM_FEE_PERCENT / 100));
  const escrowFee = roundCurrency(salePrice * (ESCROW_CONFIG.ESCROW_FEE_PERCENT / 100));
  const processingFee = roundCurrency(
    salePrice * (ESCROW_CONFIG.PROCESSING_FEE_PERCENT / 100) + ESCROW_CONFIG.PROCESSING_FEE_FIXED
  );

  const totalFees = roundCurrency(platformFee + escrowFee + processingFee);
  const totalBuyerPays = roundCurrency(salePrice + escrowFee + processingFee);
  const sellerReceives = roundCurrency(salePrice - platformFee);

  return {
    salePrice,
    platformFee,
    escrowFee,
    processingFee,
    totalFees,
    totalBuyerPays,
    sellerReceives,
  };
}

export function calculateMinimumOffer(askingPrice: number): number {
  return roundCurrency(askingPrice * (ESCROW_CONFIG.MINIMUM_OFFER_PERCENT / 100));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return formatCurrency(amount);
}

export function getTimeRemaining(deadline: string): {
  expired: boolean;
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  display: string;
} {
  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const total = deadlineTime - now;

  if (total <= 0) {
    return {
      expired: true,
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      display: 'Expired',
    };
  }

  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((total % (1000 * 60)) / 1000);

  let display: string;
  if (days > 0) {
    display = `${days}d ${hours}h`;
  } else if (hours > 0) {
    display = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    display = `${minutes}m ${seconds}s`;
  } else {
    display = `${seconds}s`;
  }

  return { expired: false, total, days, hours, minutes, seconds, display };
}

export function generateEscrowId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ESC-${timestamp}-${random}`.toUpperCase();
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN-${timestamp}-${random}`.toUpperCase();
}

export function generateOfferId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `OFR-${timestamp}-${random}`.toUpperCase();
}

export function generateListingId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `LST-${timestamp}-${random}`.toUpperCase();
}

export function addHoursToDate(date: Date | string, hours: number): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function isDeadlinePassed(deadline: string | undefined): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

// ============================================
// STATUS DISPLAY HELPERS
// ============================================

export function getStatusBadgeClass(status: EscrowStatus): string {
  return `escrow-badge escrow-badge--${status}`;
}

export function isTerminalStatus(status: EscrowStatus): boolean {
  return ['completed', 'resolved', 'refunded', 'cancelled', 'expired'].includes(status);
}

export function isActiveTransaction(status: EscrowStatus): boolean {
  return !isTerminalStatus(status) && status !== 'listed';
}

export function requiresBuyerAction(status: EscrowStatus): boolean {
  return ESCROW_STATUS_INFO[status].buyerActions.length > 0;
}

export function requiresSellerAction(status: EscrowStatus): boolean {
  return ESCROW_STATUS_INFO[status].sellerActions.length > 0;
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    make_offer: 'Make Offer',
    buy_now: 'Buy Now',
    edit_listing: 'Edit Listing',
    withdraw_listing: 'Withdraw',
    withdraw_offer: 'Withdraw Offer',
    accept_offer: 'Accept Offer',
    reject_offer: 'Reject Offer',
    counter_offer: 'Counter Offer',
    submit_payment: 'Submit Payment',
    send_credentials: 'Send Credentials',
    view_sent_credentials: 'View Sent Credentials',
    verify_access: 'Verify Access',
    raise_dispute: 'Raise Dispute',
    complete_verification: 'Complete Verification',
    leave_review: 'Leave Review',
    provide_evidence: 'Provide Evidence',
    cancel_dispute: 'Cancel Dispute',
    offer_resolution: 'Offer Resolution',
  };
  return labels[action] || action;
}
