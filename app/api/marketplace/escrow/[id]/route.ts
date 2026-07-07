import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as escrowService from '@/lib/market/escrow-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id },
      include: {
        disputes: true,
        listings: true,
      },
    });

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    // Ownership check: only the buyer or seller may read this escrow's PII
    if (escrow.buyerId !== user.id && escrow.sellerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stateFlow = await escrowService.getEscrowState(id);

    return NextResponse.json({
      ...escrow,
      stateFlow,
    });
  } catch (error) {
    console.error('[Escrow GET]', error);
    return NextResponse.json({ error: 'Failed to fetch escrow' }, { status: 500 });
  }
}
