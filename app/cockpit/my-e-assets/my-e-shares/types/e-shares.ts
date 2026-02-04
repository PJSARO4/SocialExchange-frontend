/**
 * SOCIAL EXCHANGE - COMMUNITY CREDITS SYSTEM
 * Howey Test Compliant: Utility-Based Creator Support Platform
 *
 * IMPORTANT LEGAL FRAMING:
 * - Credits provide ACCESS and BENEFITS, not investment returns
 * - This is a PATRONAGE/SUPPORT model like Patreon, not a securities exchange
 * - No profit expectations should be created or implied
 * - Value is in UTILITY (benefits), not price appreciation
 */

// ============================================
// CORE TYPES
// ============================================

export type SupporterTier = 'BACKER' | 'SUPPORTER' | 'CHAMPION' | 'FOUNDING';

export type CommunityStatus =
  | 'SETUP'       // Creator setting up their community
  | 'ACTIVE'      // Community is live and accepting supporters
  | 'PAUSED'      // Temporarily not accepting new supporters
  | 'ARCHIVED';   // Creator has fulfilled commitment period

export type TransactionType =
  | 'SETUP'       // Creator initial community setup
  | 'SUPPORT'     // Supporter purchases credits
  | 'TRANSFER'    // Gift/transfer credits to another user
  | 'REFUND'      // Refund for abandoned communities
  | 'REWARD';     // Creator rewards supporters with bonus credits

// ============================================
// SUPPORTER TIER DEFINITIONS
// ============================================

export interface TierBenefits {
  name: string;
  minCredits: number;
  benefits: string[];
  icon: string;
  color: string;
}

export const SUPPORTER_TIERS: TierBenefits[] = [
  {
    name: 'Backer',
    minCredits: 100,
    benefits: [
      'Name on supporter wall',
      'Supporter badge on your profile',
      'Access to community announcements',
    ],
    icon: '🌱',
    color: '#10b981',
  },
  {
    name: 'Supporter',
    minCredits: 500,
    benefits: [
      'All Backer benefits',
      'Early access to content',
      'Exclusive community channel access',
      'Monthly supporter newsletter',
    ],
    icon: '⭐',
    color: '#3b82f6',
  },
  {
    name: 'Champion',
    minCredits: 1000,
    benefits: [
      'All Supporter benefits',
      'Direct messaging with creator',
      'Vote on creator decisions',
      'Exclusive merchandise discounts',
      'Recognition in content',
    ],
    icon: '🏆',
    color: '#8b5cf6',
  },
  {
    name: 'Founding Member',
    minCredits: 5000,
    benefits: [
      'All Champion benefits',
      'Quarterly 1-on-1 call with creator',
      'Name in creator bio/about',
      'Co-creation opportunities',
      'Lifetime founding member status',
    ],
    icon: '👑',
    color: '#f59e0b',
  },
];

// ============================================
// CREATOR COMMUNITY
// ============================================

export interface CreatorCommunity {
  id: string;

  // Creator Identity
  creatorName: string;
  brandName: string;
  handle: string;
  platform: 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'multi';
  description: string;
  avatarUrl?: string;
  coverUrl?: string;

  // Creator Info
  creatorId: string;

  // Community Setup
  setupDeposit: number;         // Creator's initial commitment (min $100)
  totalCreditsIssued: number;   // Total credits available
  creditsPerDollar: number;     // Fixed rate: 100 credits per $1

  // Community Metrics (NOT investment metrics)
  totalSupporters: number;
  totalCreditsHeld: number;     // Credits held by supporters
  communitySize: string;        // "Growing", "Established", "Thriving"

  // Social Proof (NOT financial metrics)
  followers: number;
  contentCount: number;

  // Status & Commitment
  status: CommunityStatus;
  createdAt: number;
  commitmentEndDate: number;    // Creator's 1-year commitment period

  // Custom Benefits (creator-defined)
  customBenefits?: string[];

  // Compliance
  communityAgreementSigned: boolean;
  agreementDate?: number;
}

// ============================================
// SUPPORTER MEMBERSHIP
// ============================================

export interface SupporterMembership {
  id: string;

  // Membership Info
  userId: string;
  userName: string;
  communityId: string;
  communityName: string;

  // Credits & Tier
  credits: number;
  currentTier: SupporterTier;
  tierProgress: number;         // Progress to next tier (0-100%)
  nextTierCredits: number;      // Credits needed for next tier

  // Contribution (NOT investment)
  totalContributed: number;     // Total $ contributed to creator

  // Benefits
  benefitsUnlocked: string[];
  memberSince: number;

  // Status
  isFoundingMember: boolean;    // Joined during first month
}

// ============================================
// TRANSACTIONS
// ============================================

export interface CreditTransaction {
  id: string;
  type: TransactionType;

  // Parties
  communityId: string;
  communityName: string;
  fromUserId?: string;
  toUserId?: string;

  // Details
  credits: number;
  amount: number;              // $ amount (for SUPPORT transactions)

  // Platform fee (on purchases only, NOT on transfers)
  platformFee: number;

  // Timing
  timestamp: number;
  note?: string;

  // Status
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED';
}

// ============================================
// COMMUNITY AGREEMENT (NOT investment disclaimer)
// ============================================

export interface CommunityAgreement {
  communityId: string;
  creatorId: string;

  // Agreement Version
  agreementVersion: string;

  // Key Acknowledgments (UTILITY-FOCUSED)
  acknowledgedUtilityPurpose: boolean;      // Credits are for access/benefits
  acknowledgedNotInvestment: boolean;       // This is not a securities offering
  acknowledgedCommitmentPeriod: boolean;    // 1-year engagement commitment
  acknowledgedPlatformFees: boolean;        // Platform fee structure
  acknowledgedCommunityResponsibility: boolean; // Responsibility to supporters

  // Signature
  creatorSignature: string;
  signedAt: number;
}

// ============================================
// SUPPORTER AGREEMENT
// ============================================

export interface SupporterAgreement {
  userId: string;
  communityId: string;

  // Acknowledgments
  acknowledgedSupportNotInvestment: boolean;  // Supporting, not investing
  acknowledgedUtilityValue: boolean;          // Value is in benefits/access
  acknowledgedNoProfitExpectation: boolean;   // No expected financial return
  acknowledgedTransferLimitations: boolean;   // Credits for use, not trading

  signedAt: number;
}

// ============================================
// PLATFORM STATS (Community-focused, NOT market-focused)
// ============================================

export interface PlatformStats {
  totalCommunities: number;
  totalSupporters: number;
  totalCreatorsSupported: number;
  creditsInCirculation: number;
  platformFeesCollected: number;
}

// ============================================
// CONFIGURATION
// ============================================

export const COMMUNITY_CONFIG = {
  // Creator setup
  MIN_SETUP_DEPOSIT: 100,              // $100 minimum to create community
  CREDITS_PER_DOLLAR: 100,             // Fixed rate: $1 = 100 credits

  // Commitment period
  CREATOR_COMMITMENT_PERIOD_MS: 365 * 24 * 60 * 60 * 1000,  // 1 year

  // Platform fee (on PURCHASES only, not transfers)
  PLATFORM_FEE_PERCENT: 5,             // 5% on credit purchases

  // Supporter tiers
  TIER_BACKER: 100,
  TIER_SUPPORTER: 500,
  TIER_CHAMPION: 1000,
  TIER_FOUNDING: 5000,

  // Founding member window
  FOUNDING_MEMBER_WINDOW_MS: 30 * 24 * 60 * 60 * 1000,  // First 30 days
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTierForCredits(credits: number): TierBenefits | null {
  const sortedTiers = [...SUPPORTER_TIERS].sort((a, b) => b.minCredits - a.minCredits);
  return sortedTiers.find(tier => credits >= tier.minCredits) || null;
}

export function getNextTier(credits: number): TierBenefits | null {
  const sortedTiers = [...SUPPORTER_TIERS].sort((a, b) => a.minCredits - b.minCredits);
  return sortedTiers.find(tier => credits < tier.minCredits) || null;
}

export function getTierProgress(credits: number): number {
  const currentTier = getTierForCredits(credits);
  const nextTier = getNextTier(credits);

  if (!nextTier) return 100; // Max tier
  if (!currentTier) return (credits / SUPPORTER_TIERS[0].minCredits) * 100;

  const tierRange = nextTier.minCredits - currentTier.minCredits;
  const progress = credits - currentTier.minCredits;
  return Math.min(100, (progress / tierRange) * 100);
}

export function getCommunitySize(supporters: number): string {
  if (supporters < 10) return 'New';
  if (supporters < 50) return 'Growing';
  if (supporters < 200) return 'Established';
  if (supporters < 1000) return 'Thriving';
  return 'Legendary';
}

// ============================================
// DEPRECATED TYPES (for backward compatibility)
// Keeping old names as aliases during migration
// ============================================

/** @deprecated Use CreatorCommunity instead */
export type BrandListing = CreatorCommunity;

/** @deprecated Use SupporterMembership instead */
export type ShareHolding = SupporterMembership;

/** @deprecated Use CreditTransaction instead */
export type EShareTransaction = CreditTransaction;

/** @deprecated Use CommunityAgreement instead */
export type TransparencyAgreement = CommunityAgreement;

/** @deprecated Use PlatformStats instead */
export type MarketStats = PlatformStats;

/** @deprecated Use COMMUNITY_CONFIG instead */
export const E_SHARES_CONFIG = COMMUNITY_CONFIG;
