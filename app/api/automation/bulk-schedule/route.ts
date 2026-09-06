import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDriveAccessToken, downloadDriveToBlob, moveDriveFile } from '@/app/lib/google/drive';
import { generateCaption, mediaTypeFromMime, CaptionMode } from '@/app/lib/social/caption';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILES = 60;

interface FileInput {
  id: string;
  name: string;
  mimeType?: string;
}

interface Body {
  feedId: string;
  files: FileInput[];
  startDate: string;          // "YYYY-MM-DD" (user local calendar day)
  days?: number;              // spread window (auto-extended if not enough slots)
  times: string[];            // ["09:00","13:00","18:00"] local wall-clock
  tzOffsetMinutes: number;    // client's new Date().getTimezoneOffset()
  caption?: { mode?: CaptionMode; template?: string; hashtags?: string[]; aiPrompt?: string };
  move?: { fromFolderId: string; toFolderId: string };
}

/**
 * POST /api/automation/bulk-schedule
 * The automation engine: takes a set of Google Drive files + a posting pattern
 * (N times a day across the coming days) and creates one PENDING scheduled post
 * per file, spread across future slots. Each file is downloaded to public Blob
 * storage so Instagram can fetch it, captioned, and (optionally) its Drive
 * original is moved to a "posted" folder so it's never scheduled twice.
 *
 * The publish cron then posts each one when its time arrives.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { feedId, files, startDate, times, tzOffsetMinutes } = body;
  if (!feedId || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: 'feedId and at least one file are required' }, { status: 400 });
  }
  if (!Array.isArray(times) || times.length === 0) {
    return NextResponse.json({ error: 'At least one posting time is required' }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Too many files in one batch (max ${MAX_FILES}). Split into smaller batches.` },
      { status: 400 }
    );
  }

  // Verify the feed belongs to this user and is connected.
  const feed = await prisma.socialFeed.findFirst({
    where: { id: feedId, userId: user.id },
    select: { id: true, isConnected: true, accessToken: true },
  });
  if (!feed) return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
  if (!feed.isConnected || !feed.accessToken) {
    return NextResponse.json({ error: 'Feed is not connected' }, { status: 400 });
  }

  // Build future time slots (extend day window until we have enough).
  const slots = buildSlots(startDate, times, tzOffsetMinutes, files.length);
  if (slots.length === 0) {
    return NextResponse.json({ error: 'No future time slots — pick a later start date/time' }, { status: 400 });
  }

  const offset = Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : 0;
  const captionMode: CaptionMode = body.caption?.mode || 'filename';

  let driveToken: string | null = null;
  try {
    driveToken = await getDriveAccessToken(user.id);
  } catch {
    return NextResponse.json({ error: 'Google Drive not connected — connect Drive first' }, { status: 400 });
  }

  const created: any[] = [];
  const errors: { file: string; error: string }[] = [];
  let moved = 0;
  let moveScopeMissing = false;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const when = slots[i];
    try {
      // 1) download original to public Blob (Instagram must fetch a public URL)
      const { url, contentType } = await downloadDriveToBlob(driveToken, file.id, file.name);
      const mediaType = mediaTypeFromMime(file.mimeType || contentType || '');

      // 2) caption
      const caption = await generateCaption({
        mode: captionMode,
        fileName: file.name,
        template: body.caption?.template,
        hashtags: body.caption?.hashtags,
        aiPrompt: body.caption?.aiPrompt,
      });

      // 3) create the scheduled post (PENDING so the cron publishes it)
      const post = await prisma.scheduledPostNew.create({
        data: {
          feedId,
          caption,
          mediaUrls: [url],
          mediaType: mediaType as any,
          scheduledFor: when,
          timezone: offsetToTz(offset),
          status: 'PENDING',
        },
      });

      // 4) move original out of the to-post folder so it's never re-scheduled
      if (body.move?.fromFolderId && body.move?.toFolderId) {
        try {
          await moveDriveFile(driveToken, file.id, body.move.toFolderId, body.move.fromFolderId);
          moved++;
        } catch (e: any) {
          if (/insufficient|scope|permission/i.test(e?.message || '')) moveScopeMissing = true;
        }
      }

      created.push({ id: post.id, file: file.name, scheduledFor: when.toISOString(), mediaType });
    } catch (e: any) {
      errors.push({ file: file.name, error: String(e?.message || e) });
    }
  }

  return NextResponse.json({
    scheduled: created.length,
    failed: errors.length,
    moved,
    moveScopeMissing,
    firstAt: created[0]?.scheduledFor || null,
    lastAt: created[created.length - 1]?.scheduledFor || null,
    created,
    errors,
    note: moveScopeMissing
      ? 'Posts scheduled, but moving Drive files needs write access — re-connect Drive to enable auto-move.'
      : undefined,
  });
}

/** Generate `count` future UTC instants from startDate at the given local times. */
function buildSlots(startDate: string, times: string[], tzOffsetMinutes: number, count: number): Date[] {
  const offset = Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : 0;
  const [y, m, d] = (startDate || '').split('-').map((n) => parseInt(n, 10));
  const base =
    Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
      ? Date.UTC(y, m - 1, d)
      : Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());

  const now = Date.now();
  const parsed = times
    .map((t) => {
      const [hh, mm] = t.split(':').map((n) => parseInt(n, 10));
      return { hh: hh || 0, mm: mm || 0 };
    })
    .sort((a, b) => a.hh * 60 + a.mm - (b.hh * 60 + b.mm));

  const out: Date[] = [];
  // Walk forward day-by-day (cap at 120 days) until we have enough slots.
  for (let day = 0; day < 120 && out.length < count; day++) {
    const dayMs = base + day * 86400000;
    for (const { hh, mm } of parsed) {
      // local wall clock -> UTC: add the client's offset (getTimezoneOffset = UTC-local, minutes)
      const utcMs = dayMs + hh * 3600000 + mm * 60000 + offset * 60000;
      if (utcMs > now + 30000) out.push(new Date(utcMs));
      if (out.length >= count) break;
    }
  }
  return out;
}

function offsetToTz(offsetMinutes: number): string {
  // Store a UTC offset label; display is handled client-side.
  const sign = offsetMinutes <= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `UTC${sign}${h}:${m}`;
}
