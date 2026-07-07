import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/marketplace/listings/[id]/delist
 * Marks a listing as DELISTED. Only the owner can delist.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const listing = await prisma.listing.findUnique({
      where: { id: id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.sellerId !== user.id) {
      return NextResponse.json({ error: 'Only the seller can delist this listing' }, { status: 403 });
    }

    if (listing.saleStatus === 'PENDING') {
      return NextResponse.json({ error: 'Cannot delist a listing with a pending sale' }, { status: 400 });
    }

    const updated = await prisma.listing.update({
      where: { id: id },
      data: { saleStatus: 'CANCELLED', status: 'DELISTED' },
    });

    return NextResponse.json({ success: true, listing: updated });
  } catch (error: any) {
    console.error('[Delist POST]', error);
    return NextResponse.json({ error: 'Failed to delist listing' }, { status: 500 });
  }
}
