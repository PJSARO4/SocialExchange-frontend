import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import * as listingService from '@/lib/market/listing-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await listingService.getListing(params.id);

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Record view
    await listingService.recordListingView(params.id);

    return NextResponse.json(listing);
  } catch (error) {
    console.error('[Listing GET]', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

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
    const updated = await listingService.updateListing(params.id, user.id, body);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[Listing PATCH]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update listing' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await listingService.deleteListing(params.id, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Listing DELETE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete listing' },
      { status: 400 }
    );
  }
}
