import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'marketCap';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const brands = await prisma.brand.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        ticker: true,
        name: true,
        logoUrl: true,
        currentPrice: true,
        priceChange24h: true,
        marketCap: true,
        volume24h: true,
        sharesOutstanding: true,
      },
      orderBy: {
        [sortBy === 'marketCap' ? 'marketCap' :
         sortBy === 'volume' ? 'volume24h' :
         sortBy === 'price' ? 'currentPrice' :
         'ipoDate']: sortOrder as 'asc' | 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.brand.count({
      where: { status: 'ACTIVE' },
    });

    return NextResponse.json({
      brands,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error('[Brands GET]', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}
