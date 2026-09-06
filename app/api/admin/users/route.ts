import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'pjsaro4@gmail.com';

const ONLINE_WINDOW_MS = 5 * 60 * 1000; // "online" = active in last 5 min

/**
 * GET /api/admin/users
 * Owner-only. Returns the full user list plus each user's presence (location +
 * what they're working on) for the admin table and the live map.
 */
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        lastActiveAt: true,
        lastActivity: true,
        lastPath: true,
        lastCity: true,
        lastRegion: true,
        lastCountry: true,
        lastLat: true,
        lastLng: true,
        _count: {
          select: { socialFeeds: true, listings: true },
        },
      },
    });

    const now = Date.now();
    const list = users.map((u) => {
      const active = u.lastActiveAt ? now - new Date(u.lastActiveAt).getTime() : Infinity;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        joinedAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
        activity: u.lastActivity || null,
        path: u.lastPath || null,
        online: active <= ONLINE_WINDOW_MS,
        feeds: u._count.socialFeeds,
        listings: u._count.listings,
        location:
          u.lastLat != null && u.lastLng != null
            ? {
                lat: u.lastLat,
                lng: u.lastLng,
                city: u.lastCity,
                region: u.lastRegion,
                country: u.lastCountry,
              }
            : null,
      };
    });

    return NextResponse.json({
      total: list.length,
      onlineNow: list.filter((u) => u.online).length,
      located: list.filter((u) => u.location).length,
      users: list,
    });
  } catch (error) {
    console.error('[Admin Users]', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
