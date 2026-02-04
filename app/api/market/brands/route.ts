/**
 * Brands API Routes
 *
 * GET /api/market/brands - List all active brands
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveBrands, getBrand, getPriceHistory, getRecentTrades } from '@/lib/market/trading-service';
import { IS_DEMO_MODE } from '@/lib/market/constants';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/market/brands
 * List all active brands for the trading floor
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('id');
    const ticker = searchParams.get('ticker');
    const includeHistory = searchParams.get('history') === 'true';
    const includeTrades = searchParams.get('trades') === 'true';

    // Get single brand by ID or ticker
    if (brandId || ticker) {
      const brand = await getBrand(brandId || ticker!);

      if (!brand) {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        );
      }

      const response: Record<string, unknown> = {
        brand,
        demoMode: IS_DEMO_MODE,
      };

      if (includeHistory) {
        response.priceHistory = await getPriceHistory(brand.id);
      }

      if (includeTrades) {
        response.recentTrades = await getRecentTrades(brand.id);
      }

      return NextResponse.json(response);
    }

    // List all brands
    const sortBy = searchParams.get('sort') || 'marketCap';
    const order = searchParams.get('order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');

    let brands = await getActiveBrands();

    // Sort
    if (sortBy === 'price') {
      brands.sort((a, b) => b.currentPrice - a.currentPrice);
    } else if (sortBy === 'change') {
      brands.sort((a, b) => b.priceChange24h - a.priceChange24h);
    } else if (sortBy === 'volume') {
      brands.sort((a, b) => b.volume24h - a.volume24h);
    } else {
      brands.sort((a, b) => b.marketCap - a.marketCap);
    }

    if (order === 'asc') {
      brands.reverse();
    }

    brands = brands.slice(0, limit);

    return NextResponse.json({
      brands,
      total: brands.length,
      demoMode: IS_DEMO_MODE,
    });
  } catch (error) {
    console.error('Brands GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch brands' },
      { status: 500 }
    );
  }
}
