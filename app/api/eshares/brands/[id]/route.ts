import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        shareholdings: {
          select: {
            id: true,
            quantity: true,
            averageCost: true,
          },
          take: 10,
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get price history (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const priceHistory = await prisma.priceHistory.findMany({
      where: {
        brandId: id,
        interval: 'MINUTE_1',
        createdAt: { gte: oneDayAgo },
      },
      orderBy: { createdAt: 'asc' },
      take: 1440, // 24 hours of minute data
    });

    return NextResponse.json({
      ...brand,
      priceHistory,
    });
  } catch (error) {
    console.error('[Brand GET]', error);
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
  }
}
