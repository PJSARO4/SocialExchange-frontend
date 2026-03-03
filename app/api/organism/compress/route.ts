import { NextResponse } from 'next/server';
import { PLATFORM_SPECS } from '@/app/cockpit/my-e-assets/my-e-storage/organism/lib/compression-engine';

// ============================================
// POST /api/organism/compress
// Returns platform specs (actual compression is client-side)
// ============================================

export async function POST(req: Request) {
  try {
    const { platform } = await req.json();

    if (platform && PLATFORM_SPECS[platform as keyof typeof PLATFORM_SPECS]) {
      const spec = PLATFORM_SPECS[platform as keyof typeof PLATFORM_SPECS];
      return NextResponse.json({ spec });
    }

    // Return all specs
    return NextResponse.json({
      specs: Object.values(PLATFORM_SPECS).map((s) => ({
        name: s.name,
        label: s.label,
        width: s.width,
        height: s.height,
        maxFileSize: s.maxFileSize,
      })),
    });
  } catch (err) {
    console.error('[SYN] Compress route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
