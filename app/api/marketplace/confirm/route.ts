import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as escrowService from '@/lib/market/escrow-service';

/**
 * POST /api/marketplace/confirm
 * Buyer confirms receipt of credentials (starts 48h lock)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { escrowId } = body;

    // Verify user is the buyer
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    if (escrow.buyerId !== user.id) {
      return NextResponse.json({ error: 'Only buyer can confirm receipt' }, { status: 403 });
    }

    const updated = await escrowService.confirmReceipt(escrowId);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Confirm POST]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to confirm receipt' },
      { status: 400 }
    );
  }
}
