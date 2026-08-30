/**
 * Template catalogue proxy.
 *
 * Fetches the memegen.link template list server-side and returns a trimmed
 * shape. Proxying (rather than calling memegen from the browser) keeps the
 * client on one origin and lets us cache the list on our own edge.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 3600;

const MEMEGEN = 'https://api.memegen.link';

export interface TemplateSummary {
  id: string;
  name: string;
  lines: number;
}

interface MemegenTemplate {
  id?: unknown;
  name?: unknown;
  lines?: unknown;
}

export async function GET() {
  try {
    const res = await fetch(`${MEMEGEN}/templates`, {
      headers: { 'User-Agent': 'SocialExchange-MemeLab/1.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Template source returned ${res.status}`, templates: [] },
        { status: 502 },
      );
    }

    const raw: unknown = await res.json();
    if (!Array.isArray(raw)) {
      return NextResponse.json(
        { error: 'Unexpected template payload', templates: [] },
        { status: 502 },
      );
    }

    const templates: TemplateSummary[] = [];
    for (const entry of raw as MemegenTemplate[]) {
      const id = typeof entry.id === 'string' ? entry.id : null;
      const lines = typeof entry.lines === 'number' ? entry.lines : 0;
      if (!id || !/^[a-z0-9-]+$/i.test(id)) continue;
      if (lines < 2) continue; // need a top and a bottom slot
      templates.push({
        id,
        name: typeof entry.name === 'string' && entry.name ? entry.name : id,
        lines,
      });
    }

    return NextResponse.json(
      { templates },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the template source', templates: [] },
      { status: 502 },
    );
  }
}
