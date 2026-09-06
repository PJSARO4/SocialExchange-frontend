import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/instagram/recent?feedId=...
 * Returns the authenticated user's own recent Instagram media, resolving the
 * access token server-side from the SocialFeed row. Used to confirm publishes
 * (permalink) and to show a recent-posts view. Only ever the user's own account.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const feedId = request.nextUrl.searchParams.get('feedId');
  const feed = await prisma.socialFeed.findFirst({
    where: {
      userId: user.id,
      platform: 'INSTAGRAM',
      isConnected: true,
      ...(feedId ? { id: feedId } : {}),
    },
    select: { id: true, handle: true, accessToken: true, platformAccountId: true },
  });

  if (!feed) {
    return NextResponse.json(
      { error: 'No connected Instagram feed found for this account' },
      { status: 403 }
    );
  }

  try {
    const meUrl = `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(
      feed.accessToken
    )}`;
    const me = await fetch(meUrl).then(r => r.json());

    const fields = 'id,permalink,media_type,media_url,thumbnail_url,timestamp,caption';
    const mediaUrl = `https://graph.instagram.com/me/media?fields=${fields}&limit=6&access_token=${encodeURIComponent(
      feed.accessToken
    )}`;
    const media = await fetch(mediaUrl).then(r => r.json());

    if (media.error) {
      return NextResponse.json(
        { error: media.error.message, handle: feed.handle, username: me?.username },
        { status: 400 }
      );
    }

    return NextResponse.json({
      handle: feed.handle,
      username: me?.username,
      accountId: me?.id ?? feed.platformAccountId,
      posts: media.data ?? [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch media' }, { status: 500 });
  }
}
