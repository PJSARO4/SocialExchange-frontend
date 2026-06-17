// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/marketplace/escrow/mine
 * Returns all escrow transactions where the current user is buyer or seller.
 */
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

    const escrows = await prisma.escrowTransaction.findMany({
      where: {
        OR: [
          { buyerId: user.id },
          { sellerId: user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        listings: {
          select: {
            id: true,
            title: true,
            handle: true,
            platform: true,
            price: true,
            followers: true,
          },
          take: 1,
        },
      },
    });

    // Serialize Decimal fields
    const serialized = escrows.map((e: any) => {
      const firstListing = e.listings?.[0] ?? null;
      return {
        id: e.id,
        status: e.status,
        buyerId: e.buyerId,
        sellerId: e.sellerId,
        listingId: firstListing?.id ?? null,
        amount: Number(e.listingPrice ?? 0),
        platformFee: Number(e.platformFee ?? 0),
        sellerPayout: Number(e.sellerPayout ?? 0),
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        listing: firstListing
          ? {
              id: firstListing.id,
              title: firstListing.title,
              handle: firstListing.handle,
              platform: firstListing.platform,
              price: Number(firstListing.price),
              followers: firstListing.followers,
            }
          : {
              // Fall back to the snapshot fields stored on the escrow itself
              id: null,
              title: e.listingTitle,
              handle: e.listingHandle,
              platform: e.listingPlatform,
              price: Number(e.listingPrice ?? 0),
              followers: null,
            },
      };
    });

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('[Escrow Mine GET]', error);
    return NextResponse.json({ error: 'Failed to fetch escrow transactions' }, { status: 500 });
  }
}
