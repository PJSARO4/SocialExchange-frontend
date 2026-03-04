import { NextResponse } from 'next/server';
import { searchAllSources } from '@/app/cockpit/my-e-assets/my-e-storage/organism/lib/content-sources';
import { checkRateLimit } from '../rate-limit';

// ============================================
// POST /api/organism/scrape
// Content discovery from public sources
// ============================================

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateCheck = checkRateLimit('scrape', clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again shortly.' },
        { status: 429 }
      );
    }

    const { query, type = 'all', perPage = 8 } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Check if any API keys are configured
    const hasUnsplash = !!process.env.UNSPLASH_ACCESS_KEY;
    const hasPexels = !!process.env.PEXELS_API_KEY;

    if (!hasUnsplash && !hasPexels) {
      return NextResponse.json({
        results: [],
        message:
          'No content source API keys configured. Set UNSPLASH_ACCESS_KEY or PEXELS_API_KEY in .env.local',
      });
    }

    const results = await searchAllSources(query, type, perPage);

    return NextResponse.json({
      results,
      count: results.length,
      sources: {
        unsplash: hasUnsplash,
        pexels: hasPexels,
      },
    });
  } catch (err) {
    console.error('[SYN] Scrape route error:', err);
    return NextResponse.json(
      { error: 'Content search failed' },
      { status: 500 }
    );
  }
}
