// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import * as listingService from '@/lib/market/listing-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      status: searchParams.get('status') || 'ACTIVE',
      saleStatus: searchParams.get('saleStatus') || 'AVAILABLE',
      platform: searchParams.get('platform') || undefined,
      niche: searchParams.get('niche') || undefined,
      minFollowers: searchParams.get('minFollowers') ? parseInt(searchParams.get('minFollowers')!) : undefined,
      maxFollowers: searchParams.get('maxFollowers') ? parseInt(searchParams.get('maxFollowers')!) : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      sortBy: searchParams.get('sortBy') as any,
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const result = await listingService.listListings(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Listings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const listing = await listingService.createListing(user.id, {
      title: body.title,
      description: body.description,
      platform: body.platform,
      handle: body.handle,
      profileUrl: body.profileUrl,
      followers: body.followers,
      following: body.following,
      postsCount: body.postsCount,
      engagementRate: body.engagementRate,
      avgLikesPerPost: body.avgLikesPerPost,
      avgCommentsPerPost: body.avgCommentsPerPost,
      niche: body.niche,
      contentCategory: body.contentCategory,
      price: body.price,
      proofUrls: body.proofUrls || [],
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('[Listings POST]', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
