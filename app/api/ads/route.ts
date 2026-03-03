import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ads - List all ad campaigns for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await prisma.adCampaign.findMany({
      where: { userId: session.user.id },
      include: {
        ads: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('[ads] Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ads - Create a new ad campaign with ads
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      feedId,
      objective,
      budgetType = 'daily',
      budgetAmount = 0,
      budgetCurrency = 'USD',
      bidStrategy = 'lowest_cost',
      startDate,
      endDate,
      timezone = 'UTC',
      ads = [],
    } = body;

    if (!name || !objective) {
      return NextResponse.json(
        { error: 'Missing required fields: name, objective' },
        { status: 400 }
      );
    }

    // Create campaign with nested ads
    const campaign = await prisma.adCampaign.create({
      data: {
        userId: session.user.id,
        feedId: feedId || null,
        name,
        objective,
        budgetType,
        budgetAmount,
        budgetCurrency,
        bidStrategy,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        timezone,
        ads: {
          create: ads.map((ad: any) => ({
            name: ad.name || name,
            platform: ad.platform || 'instagram',
            format: ad.format || 'single_image',
            headline: ad.headline || null,
            primaryText: ad.primaryText || null,
            callToAction: ad.callToAction || 'Learn More',
            destinationUrl: ad.destinationUrl || null,
            mediaUrls: ad.mediaUrls || [],
            targetLocations: ad.targetLocations || [],
            targetAgeMin: ad.targetAgeMin || 18,
            targetAgeMax: ad.targetAgeMax || 65,
            targetGenders: ad.targetGenders || ['all'],
            targetInterests: ad.targetInterests || [],
            status: 'draft',
          })),
        },
      },
      include: {
        ads: true,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: any) {
    console.error('[ads] Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/ads - Update a campaign's status
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, status, name } = body;

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.adCampaign.findFirst({
      where: { id: campaignId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const updated = await prisma.adCampaign.update({
      where: { id: campaignId },
      data: {
        ...(status && { status }),
        ...(name && { name }),
      },
      include: { ads: true },
    });

    return NextResponse.json({ campaign: updated });
  } catch (error: any) {
    console.error('[ads] Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/ads - Delete a campaign
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.adCampaign.findFirst({
      where: { id: campaignId, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await prisma.adCampaign.delete({ where: { id: campaignId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ads] Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign', details: error.message },
      { status: 500 }
    );
  }
}
