// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as escrowService from '@/lib/market/escrow-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: params.id },
      include: {
        disputes: true,
        listings: true,
      },
    });

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 });
    }

    const stateFlow = await escrowService.getEscrowState(params.id);

    return NextResponse.json({
      ...escrow,
      stateFlow,
    });
  } catch (error) {
    console.error('[Escrow GET]', error);
    return NextResponse.json({ error: 'Failed to fetch escrow' }, { status: 500 });
  }
}
