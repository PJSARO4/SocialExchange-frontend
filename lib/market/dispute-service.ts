// @ts-nocheck
/**
 * Dispute Service for Trading Post
 */

import { prisma } from '@/lib/prisma';
import { DisputeStatus } from '@prisma/client';
import { EscrowStatus } from '@prisma/client';

export interface OpenDisputeRequest {
  escrowId: string;
  reason: string;
  evidence?: string;
  evidenceUrls?: string[];
}

export interface ResolveDisputeRequest {
  disputeId: string;
  resolution: string;
  refundBuyer: boolean;
  refundAmount?: number;
}

export async function openDispute(userId: string, request: OpenDisputeRequest) {
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: request.escrowId },
  });

  if (!escrow) throw new Error('Escrow not found');
  if (escrow.buyerId !== userId && escrow.sellerId !== userId) throw new Error('Only buyer or seller can open dispute');
  if (['COMPLETED', 'REFUNDED', 'CANCELLED'].includes(escrow.status)) throw new Error(`Cannot open dispute: escrow is already ${escrow.status.toLowerCase()}`);

  const dispute = await prisma.dispute.create({
    data: {
      escrowId: request.escrowId,
      openerId: userId,
      reason: request.reason,
      evidence: request.evidence,
      evidenceUrls: request.evidenceUrls || [],
      status: 'OPEN',
    },
    include: {
      escrow: true,
      opener: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.escrowTransaction.update({
    where: { id: request.escrowId },
    data: { status: 'DISPUTED' },
  });

  return dispute;
}

export async function getDisputesByEscrow(escrowId: string) {
  return prisma.dispute.findMany({
    where: { escrowId },
    include: {
      opener: { select: { id: true, name: true, email: true } },
      escrow: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserDisputes(userId: string) {
  return prisma.dispute.findMany({
    where: { openerId: userId },
    include: {
      escrow: { select: { id: true, listingTitle: true, buyerId: true, sellerId: true, listingPrice: true } },
      opener: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function resolveDispute(request: ResolveDisputeRequest) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: request.disputeId },
    include: { escrow: true },
  });

  if (!dispute) throw new Error('Dispute not found');
  if (dispute.status !== 'OPEN') throw new Error('Dispute is already resolved');

  const newStatus: DisputeStatus = request.refundBuyer ? 'RESOLVED' : 'RESOLVED';

  const updatedDispute = await prisma.dispute.update({
    where: { id: request.disputeId },
    data: {
      status: newStatus,
      resolution: request.resolution,
      resolvedBy: 'ADMIN',
      refundAmount: request.refundAmount ? request.refundAmount : dispute.escrow.listingPrice,
      closedAt: new Date(),
    },
  });

  const escrowStatus: EscrowStatus = request.refundBuyer ? 'REFUNDED' : 'COMPLETED';
  await prisma.escrowTransaction.update({
    where: { id: dispute.escrowId },
    data: { status: escrowStatus, disputeResolution: request.resolution },
  });

  return updatedDispute;
}

export async function getOpenDisputes() {
  return prisma.dispute.findMany({
    where: { status: 'OPEN' },
    include: {
      escrow: { select: { id: true, listingTitle: true, buyerId: true, sellerId: true, listingPrice: true, status: true, createdAt: true } },
      opener: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getDisputeStats() {
  const [totalDisputes, openDisputes, resolvedDisputes, closedDisputes] = await Promise.all([
    prisma.dispute.count(),
    prisma.dispute.count({ where: { status: 'OPEN' } }),
    prisma.dispute.count({ where: { status: { in: ['RESOLVED'] } } }),
    prisma.dispute.count({ where: { status: 'CLOSED' } }),
  ]);

  return { totalDisputes, openDisputes, resolvedDisputes, closedDisputes };
}

export async function closeDispute(disputeId: string) {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) throw new Error('Dispute not found');
  if (dispute.status === 'OPEN') throw new Error('Cannot close an open dispute. Resolve it first.');

  return prisma.dispute.update({
    where: { id: disputeId },
    data: { status: 'CLOSED' },
  });
}

export async function addDisputeEvidence(
  disputeId: string,
  userId: string,
  evidence: string,
  evidenceUrls?: string[]
) {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) throw new Error('Dispute not found');
  if (dispute.status !== 'OPEN') throw new Error('Cannot add evidence to a closed dispute');
  if (dispute.openerId !== userId) throw new Error('Only the dispute opener can add evidence');

  const newEvidenceUrls = [...(dispute.evidenceUrls || []), ...(evidenceUrls || [])];

  return prisma.dispute.update({
    where: { id: disputeId },
    data: {
      evidence: dispute.evidence ? `${dispute.evidence}\n\n${evidence}` : evidence,
      evidenceUrls: newEvidenceUrls,
      updatedAt: new Date(),
    },
  });
}
