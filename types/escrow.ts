// Escrow Types

export enum EscrowStage {
  INITIATED = 'initiated',
  PENDING = 'pending',
  FUNDED = 'funded',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export interface EscrowTransaction {
  id: string;
  stage: EscrowStage;
  amount: number;
  currency: string;
  buyerId: string;
  sellerId: string;
  itemId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface EscrowParticipant {
  id: string;
  name: string;
  role: 'buyer' | 'seller' | 'mediator';
  verified: boolean;
}

export default EscrowStage;
