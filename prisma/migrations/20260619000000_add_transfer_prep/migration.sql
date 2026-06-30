-- Add TRANSFER_PREP status to EscrowStatus enum
ALTER TYPE "EscrowStatus" ADD VALUE IF NOT EXISTS 'TRANSFER_PREP';

-- Add transfer preparation fields to EscrowTransaction
ALTER TABLE "escrow_transactions"
  ADD COLUMN IF NOT EXISTS "transfer_prep_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "escrow_email" TEXT;
