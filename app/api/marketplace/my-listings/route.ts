// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/marketplace/my-listings
 * Returns all listings owned by the current user.
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

    const listings = await prisma.listing.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        escrow: {
          select: { id: true, status: true },
        },
      },
    });

    // Shape the response
    const shaped = listings.map((l: any) => ({
      id: l.id,
      title: l.title,
      platform: l.platform,
      handle: l.handle || '',
      followers: l.followers || 0,
      price: Number(l.price),
      niche: l.niche || '',
      saleStatus: l.saleStatus || 'ACTIVE',
      createdAt: l.createdAt,
      views: l.views || 0,
      escrowId: l.escrow?.id || null,
    }));

    return NextResponse.json({ listings: shaped });
  } catch (error: any) {
    console.error('[MyListings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}
