import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/presence/ping  { path, activity }
 * Records where the signed-in user is + what they're working on, for the admin
 * live map. Location comes from Vercel's free geo headers (x-vercel-ip-*) — no
 * GPS, coarse city-level only. Nothing is exposed to the user themselves.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let body: { path?: string; activity?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }

  const h = req.headers;
  const lat = parseFloat(h.get('x-vercel-ip-latitude') || '');
  const lng = parseFloat(h.get('x-vercel-ip-longitude') || '');
  const city = decodeGeo(h.get('x-vercel-ip-city'));
  const region = decodeGeo(h.get('x-vercel-ip-country-region'));
  const country = decodeGeo(h.get('x-vercel-ip-country'));

  const data: Record<string, unknown> = {
    lastActiveAt: new Date(),
    lastActivity: (body.activity || 'Online').slice(0, 60),
    lastPath: (body.path || '').slice(0, 200),
  };
  // Only overwrite location when Vercel actually provided it (local dev has none).
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    data.lastLat = lat;
    data.lastLng = lng;
  }
  if (city) data.lastCity = city;
  if (region) data.lastRegion = region;
  if (country) data.lastCountry = country;

  try {
    await prisma.user.update({
      where: { email: session.user.email },
      data,
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}

// Vercel URL-encodes city/region headers (e.g. "San%20Francisco").
function decodeGeo(v: string | null): string | null {
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}
