import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as disputeService from '@/lib/market/dispute-service';

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const escrowId = searchParams.get('escrowId');

    if (!escrowId) {
      return NextResponse.json({ error: 'escrowId is required' }, { status: 400 });
    }

    // Scope to disputes the user is party to: verify the user is the
    // buyer or seller on the escrow these disputes belong to.
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      select: { buyerId: true, sellerId: true },
    });

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    if (escrow.buyerId !== user.id && escrow.sellerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const disputes = await disputeService.getDisputesByEscrow(escrowId);

    return NextResponse.json(disputes);
  } catch (error) {
    console.error('[Disputes GET]', error);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}

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

    const dispute = await disputeService.openDispute(user.id, {
      escrowId: body.escrowId,
      reason: body.reason,
      evidence: body.evidence,
      evidenceUrls: body.evidenceUrls,
    });

    return NextResponse.json(dispute, { status: 201 });
  } catch (error: any) {
    console.error('[Disputes POST]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to open dispute' },
      { status: 400 }
    );
  }
}
