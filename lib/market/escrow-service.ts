/**
 * Escrow Service for Trading Post
 * Handles secure account transfers with multi-stage verification
 */

import { prisma } from '@/lib/prisma';
import { EscrowStatus } from '@prisma/client';

export interface EscrowStateFlow {
  current: EscrowStatus;
  nextSteps: EscrowStatus[];
  timeout?: Date;
  timeoutMinutes?: number;
}

/**
 * Create an escrow transaction for a listing purchase
 */
export async function createEscrowTransaction(
  buyerId: string,
  sellerId: string,
  listingId: string,
  listing: any
) {
  const platformFeeUSD = Number(listing.price) * 0.10; // 10% platform fee
  const sellerPayoutUSD = Number(listing.price) - platformFeeUSD;

  const transaction = await prisma.escrowTransaction.create({
    data: {
      buyerId,
      sellerId,
      listingTitle: listing.title,
      listingPlatform: listing.platform,
      listingHandle: listing.handle,
      listingUrl: listing.profileUrl,
      listingPrice: listing.price,
      platformFee: platformFeeUSD,
      sellerPayout: sellerPayoutUSD,
      status: 'PAYMENT_PENDING',
      paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  // Link to listing
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      escrowId: transaction.id,
      saleStatus: 'PENDING',
    },
  });

  return transaction;
}

/**
 * Move escrow to funds held (buyer payment confirmed)
 */
export async function confirmPayment(escrowId: string) {
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: escrowId },
  });

  if (!escrow) throw new Error('Escrow not found');
  if (escrow.status !== 'PAYMENT_PENDING') {
    throw new Error(`Cannot confirm payment: escrow status is ${escrow.status}`);
  }

  return prisma.escrowTransaction.update({
    where: { id: escrowId },
    data: {
      status: 'FUNDS_HELD',
      transferDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days to transfer
    },
  });
}

/**
 * Seller completes the transfer preparation checklist (FUNDS_HELD → TRANSFER_PREP)
 * Records that the seller has removed 2FA, changed recovery email, etc.
 */
export async function completeTransferPrep(escrowId: string) {
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: escrowId },
  });

  if (!escrow) throw new Error('Escrow not found');
  if (escrow.status !== 'FUNDS_HELD') {
    throw new Error(`Cannot complete transfer prep: escrow status is ${escrow.status}`);
  }

  const escrowEmail = `escrow-${escrowId.slice(0, 12)}@socialexchange.com`;

  return prisma.escrowTransaction.update({
    where: { id: escrowId },
    data: {
      status: 'TRANSFER_PREP',
      transferPrepAt: new Date(),
      escrowEmail,
    },
  });
}

/**
 * Seller sends credentials to buyer
 */
export async function sendCredentials(escrowId: string, credentialsDescription?: string) {
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: escrowId },
  });

  if (!escrow) throw new Error('Escrow not found');
  // Accept both FUNDS_HELD (skip prep) and TRANSFER_PREP (normal flow)
  if (!['FUNDS_HELD', 'TRANSFER_PREP'].includes(escrow.status)) {
    throw new Error(`Cannot send credentials: escrow status is ${escrow.status}`);
  }

  return prisma.escrowTransaction.update({
    where: { id: escrowId },
    data: {
      status: 'CREDENTIALS_SENT',
      credentialsSent: true,
      credentialsSentAt: new Date(),
      verificationDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours to verify
    },
  });
}

/**
 * Buyer confirms receipt and credentials work (48-hour lock starts)
 */
export async function confirmReceipt(escrowId: string) {
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: escrowId },
  });

  if (!escrow) throw new Error('Escrow not found');
  if (escrow.status !== 'CREDENTIALS_SENT') {
    throw new Error(`Cannot confirm receipt: escrow status is ${escrow.status}`);
  }

  return prisma.escrowTransaction.update({
    where: { id: escrowId },
    data: {
      status: 'VERIFICATION_PENDING',
      verifiedByBuyer: true,
      verifiedAt: new Date(),
    },
  });
}

/**
 * Verify payment lock (48 hours) and mark completed
 */
export async function completeTransaction(escrowId: string) {
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: escrowId },
  });

  if (!escrow) throw new Error('Escrow not found');
  if (escrow.status !== 'VERIFICATION_PENDING') {
    throw new Error(`Cannot complete: escrow status is ${escrow.status}`);
  }

  if (!escrow.verifiedAt || Date.now() - escrow.verifiedAt.getTime() < 48 * 60 * 60 * 1000) {
    throw new Error('Cannot complete: 48-hour lock period not yet expired');
  }

  const completed = await prisma.escrowTransaction.update({
    where: { id: escrowId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  // Update listing status
  const listing = await prisma.listing.findFirst({
    where: { escrowId },
  });

  if (listing) {
    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        saleStatus: 'SOLD',
        soldAt: new Date(),
      },
    });
  }

  return completed;
}

/**
 * Refund transaction and release funds
 */
export async function refundTransaction(escrowId: string, reason: string) {
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: escrowId },
  });

  if (!escrow) throw new Error('Escrow not found');

  // Only refund if not already completed or refunded
  if (['COMPLETED', 'REFUNDED'].includes(escrow.status)) {
    throw new Error(`Cannot refund: escrow status is ${escrow.status}`);
  }

  return prisma.escrowTransaction.update({
    where: { id: escrowId },
    data: {
      status: 'REFUNDED',
      disputeReason: reason,
    },
  });
}

/**
 * Get escrow state and next allowed transitions
 */
export async function getEscrowState(escrowId: string): Promise<EscrowStateFlow> {
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: escrowId },
  });

  if (!escrow) throw new Error('Escrow not found');

  const stateTransitions: Record<EscrowStatus, EscrowStatus[]> = {
    LISTED: ['OFFER_PENDING', 'CANCELLED'],
    OFFER_PENDING: ['OFFER_ACCEPTED', 'CANCELLED'],
    OFFER_ACCEPTED: ['PAYMENT_PENDING', 'CANCELLED'],
    PAYMENT_PENDING: ['FUNDS_HELD', 'REFUNDED'],
    FUNDS_HELD: ['TRANSFER_PREP', 'CREDENTIALS_SENT', 'DISPUTED', 'REFUNDED'],
    TRANSFER_PREP: ['CREDENTIALS_SENT', 'DISPUTED', 'REFUNDED'],
    CREDENTIALS_SENT: ['VERIFICATION_PENDING', 'DISPUTED', 'REFUNDED'],
    VERIFICATION_PENDING: ['COMPLETED', 'DISPUTED'],
    COMPLETED: [],
    DISPUTED: ['COMPLETED', 'REFUNDED'],
    REFUNDED: [],
    CANCELLED: [],
    EXPIRED: ['REFUNDED'],
  };

  return {
    current: escrow.status,
    nextSteps: stateTransitions[escrow.status] || [],
    timeout: escrow.verificationDeadline || escrow.transferDeadline || escrow.paymentDeadline,
    timeoutMinutes: escrow.verificationDeadline
      ? Math.ceil((escrow.verificationDeadline.getTime() - Date.now()) / (60 * 1000))
      : escrow.transferDeadline
        ? Math.ceil((escrow.transferDeadline.getTime() - Date.now()) / (60 * 1000))
        : escrow.paymentDeadline
          ? Math.ceil((escrow.paymentDeadline.getTime() - Date.now()) / (60 * 1000))
          : undefined,
  };
}

/**
 * Check for expired escrows and auto-refund
 */
export async function checkAndAutoRefundExpired() {
  const now = new Date();

  // Find expired pending payments
  const expiredPayments = await prisma.escrowTransaction.updateMany({
    where: {
      status: 'PAYMENT_PENDING',
      paymentDeadline: {
        lt: now,
      },
    },
    data: {
      status: 'REFUNDED',
    },
  });

  // Find expired transfers
  const expiredTransfers = await prisma.escrowTransaction.updateMany({
    where: {
      status: 'FUNDS_HELD',
      transferDeadline: {
        lt: now,
      },
    },
    data: {
      status: 'REFUNDED',
    },
  });

  // Find expired verifications
  const expiredVerifications = await prisma.escrowTransaction.updateMany({
    where: {
      status: 'CREDENTIALS_SENT',
      verificationDeadline: {
        lt: now,
      },
    },
    data: {
      status: 'REFUNDED',
    },
  });

  return {
    expiredPayments: expiredPayments.count,
    expiredTransfers: expiredTransfers.count,
    expiredVerifications: expiredVerifications.count,
  };
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(userId: string, limit = 20) {
  const transactions = await prisma.escrowTransaction.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      disputes: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return transactions;
}
