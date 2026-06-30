// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/marketplace/saved
 * Returns all listings saved by the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const saved = await prisma.savedListing.findMany({
      where: { userId: user.id },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            platform: true,
            handle: true,
            followers: true,
            price: true,
            niche: true,
            engagementRate: true,
            verificationStatus: true,
            saleStatus: true,
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });

    const shaped = saved.map((s: any) => ({
      id: s.id,
      listingId: s.listingId,
      savedAt: s.savedAt,
      listing: {
        ...s.listing,
        price: Number(s.listing.price),
        engagementRate: s.listing.engagementRate ? Number(s.listing.engagementRate) : null,
        verified: s.listing.verificationStatus === 'VERIFIED',
        saleStatus: s.listing.saleStatus || 'AVAILABLE',
      },
    }));

    return NextResponse.json({ saved: shaped });
  } catch (error: any) {
    console.error('[Saved GET]', error);
    return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 });
  }
}

/**
 * POST /api/marketplace/saved
 * Save a listing. Body: { listingId }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { listingId } = await request.json();
    if (!listingId) return NextResponse.json({ error: 'listingId required' }, { status: 400 });

    const saved = await prisma.savedListing.upsert({
      where: { userId_listingId: { userId: user.id, listingId } },
      create: { userId: user.id, listingId },
      update: {},
    });

    // Increment saves counter
    await prisma.listing.update({
      where: { id: listingId },
      data: { saves: { increment: 1 } },
    }).catch(() => {}); // non-fatal

    return NextResponse.json({ saved });
  } catch (error: any) {
    console.error('[Saved POST]', error);
    return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 });
  }
}
