/**
 * Blank-template image proxy.
 *
 * Two reasons this exists rather than pointing <img> straight at memegen:
 *  1. Canvas tainting. A cross-origin image without permissive CORS headers
 *     poisons the canvas and makes toBlob() throw, which would break export.
 *     Serving through our own origin sidesteps that entirely.
 *  2. It gives us one place to cache and to validate.
 *
 * The template id is strictly validated and the upstream host is hard-coded,
 * so this cannot be used as an open redirect or SSRF pivot.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MEMEGEN = 'https://api.memegen.link';
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') ?? '';

  if (!ID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid template id' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${MEMEGEN}/images/${encodeURIComponent(id)}.png`, {
      headers: { 'User-Agent': 'SocialExchange-MemeLab/1.0' },
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Template unavailable (${upstream.status})` },
        { status: 502 },
      );
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the template source' },
      { status: 502 },
    );
  }
}
