import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as escrowService from '@/lib/market/escrow-service';
import * as listingService from '@/lib/market/listing-service';

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
    const { listingId } = body;

    // Get listing
    const listing = await listingService.getListing(listingId);
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.saleStatus !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Listing is not available' }, { status: 400 });
    }

    if (listing.sellerId === user.id) {
      return NextResponse.json({ error: 'Cannot purchase your own listing' }, { status: 400 });
    }

    // Create escrow transaction
    const escrow = await escrowService.createEscrowTransaction(
      user.id,
      listing.sellerId,
      listingId,
      listing
    );

    return NextResponse.json(escrow, { status: 201 });
  } catch (error) {
    console.error('[Purchase POST]', error);
    return NextResponse.json({ error: 'Failed to initiate purchase' }, { status: 500 });
  }
}
