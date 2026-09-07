import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Fail-closed CRON_SECRET check (also accepts ?secret= for external cron pingers). */
function isAuthorized(req: NextRequest): boolean {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (!secret) return false;
  const header = (req.headers.get('authorization') || '').trim();
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (token && token.length === secret.length) {
    const a = Buffer.from(token);
    const b = Buffer.from(secret);
    if (timingSafeEqual(a, b)) return true;
  }
  // Allow ?secret= for external schedulers that can't set headers.
  return (req.nextUrl.searchParams.get('secret') || '').trim() === secret;
}

const IG = 'https://graph.instagram.com/v21.0';

async function publishToInstagram(
  feed: { accessToken: string; platformAccountId: string },
  post: { caption: string; mediaUrls: string[]; mediaType: string }
): Promise<string> {
  const token = feed.accessToken;
  const igUser = feed.platformAccountId;
  const mediaUrl = post.mediaUrls?.[0];
  if (!mediaUrl) throw new Error('No media URL on scheduled post');

  const isVideo = post.mediaType === 'VIDEO' || post.mediaType === 'REELS';
  const params = new URLSearchParams({ access_token: token });
  if (isVideo) {
    params.set('video_url', mediaUrl);
    params.set('media_type', post.mediaType === 'REELS' ? 'REELS' : 'VIDEO');
  } else {
    params.set('image_url', mediaUrl);
  }
  if (post.caption) params.set('caption', post.caption);

  // 1) create container
  const cRes = await fetch(`${IG}/${igUser}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const cData = await cRes.json();
  if (cData.error) throw new Error(cData.error.message || 'container failed');
  const containerId = cData.id;

  // 2) wait until FINISHED
  for (let i = 0; i < 25; i++) {
    const s = await fetch(
      `${IG}/${containerId}?fields=status_code&access_token=${token}`
    ).then((r) => r.json());
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR') throw new Error('media processing failed');
    await new Promise((r) => setTimeout(r, 2000));
  }

  // 3) publish
  const pRes = await fetch(`${IG}/${igUser}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: containerId, access_token: token }),
  });
  const pData = await pRes.json();
  if (pData.error) throw new Error(pData.error.message || 'publish failed');
  return pData.id;
}

/**
 * GET /api/cron/publish-scheduled
 * Publishes every scheduled post whose time has arrived. Runs from Vercel Cron
 * (daily on Hobby) or an external cron pinger (every N minutes) for true
 * multi-per-day timing. Marks posts PUBLISHED/FAILED; retries up to 3x.
 */
export async function GET(req: NextRequest) {
  // Safe diagnostic: never returns the value, only whether the runtime sees it
  // and its length. Helps confirm env wiring without leaking the secret.
  if (req.nextUrl.searchParams.get('debug') === '1') {
    const s = process.env.CRON_SECRET || '';
    return NextResponse.json({ hasSecret: !!s, length: s.length, trimmedLength: s.trim().length });
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const due = await prisma.scheduledPostNew.findMany({
    where: {
      // PENDING = created by the bulk automation engine;
      // QUEUED  = created by the single-post scheduler UI (its job queue has no
      //           running worker on Hobby, so this cron is the sole publisher).
      status: { in: ['PENDING', 'QUEUED'] },
      scheduledFor: { lte: new Date() },
      attempts: { lt: 3 },
    },
    include: {
      feed: { select: { accessToken: true, platformAccountId: true, isConnected: true } },
    },
    orderBy: { scheduledFor: 'asc' },
    take: 20,
  });

  const results: Array<{ id: string; ok: boolean; mediaId?: string; error?: string }> = [];

  for (const post of due) {
    try {
      if (!post.feed?.isConnected) throw new Error('Feed not connected');
      const mediaId = await publishToInstagram(post.feed, {
        caption: post.caption,
        mediaUrls: post.mediaUrls,
        mediaType: post.mediaType as string,
      });
      await prisma.scheduledPostNew.update({
        where: { id: post.id },
        data: { status: 'PUBLISHED', publishedAt: new Date(), instagramPostId: mediaId },
      });
      results.push({ id: post.id, ok: true, mediaId });
    } catch (e: any) {
      const willRetry = post.attempts + 1 < 3;
      await prisma.scheduledPostNew.update({
        where: { id: post.id },
        data: {
          status: willRetry ? 'PENDING' : 'FAILED',
          attempts: { increment: 1 },
          lastError: String(e?.message || e),
        },
      });
      results.push({ id: post.id, ok: false, error: String(e?.message || e) });
    }
  }

  return NextResponse.json({ processed: due.length, published: results.filter((r) => r.ok).length, results });
}
