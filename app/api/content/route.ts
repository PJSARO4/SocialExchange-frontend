import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

// ============================================
// Mapping helpers: Prisma `Content` <-> UI `ContentItem`
//
// NOTE: The `Content` model only links to a `User` (no feedId/status/folder/
// scheduledFor columns), so those UI concepts are NOT persisted here. The UI
// keeps them on the client. We map the closest available columns:
//   caption   <-> description
//   hashtags  <-> aiHashtags
//   mediaUrls <-> [storageUrl]     (single URL; carousels keep only the first)
//   metadata  <-> fileName/fileSize/mimeType/width/height/duration
// ============================================

function typeToUi(t: string): 'image' | 'video' | 'carousel' | 'text' {
  switch (t) {
    case 'VIDEO':
    case 'REEL':
      return 'video';
    case 'CAROUSEL':
      return 'carousel';
    case 'STORY':
    case 'IMAGE':
    default:
      return 'image';
  }
}

function typeToDb(t: string | undefined): 'IMAGE' | 'VIDEO' | 'CAROUSEL' {
  switch (t) {
    case 'video':
      return 'VIDEO';
    case 'carousel':
      return 'CAROUSEL';
    // 'text' has no DB equivalent (no TEXT in ContentType enum) -> IMAGE
    case 'image':
    case 'text':
    default:
      return 'IMAGE';
  }
}

function sourceToUi(s: string): 'upload' | 'csv' | 'gdrive' | 'url' {
  switch (s) {
    case 'CSV_IMPORT':
      return 'csv';
    case 'CLOUD_SYNC':
      return 'gdrive';
    case 'AI_GENERATED':
    case 'UPLOAD':
    default:
      return 'upload';
  }
}

function sourceToDb(s: string | undefined): 'UPLOAD' | 'CSV_IMPORT' | 'CLOUD_SYNC' {
  switch (s) {
    case 'csv':
      return 'CSV_IMPORT';
    case 'gdrive':
    case 'url':
      return 'CLOUD_SYNC';
    case 'upload':
    default:
      return 'UPLOAD';
  }
}

function defaultMime(t: string | undefined): string {
  switch (t) {
    case 'video':
      return 'video/mp4';
    case 'image':
    case 'carousel':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Shape a Prisma `Content` row into the UI `ContentItem` type.
 */
export function serializeContent(c: any) {
  return {
    id: c.id,
    userId: c.userId,
    // feedId is not stored on the Content model; the client tracks it locally.
    feedId: undefined as string | undefined,
    type: typeToUi(c.type),
    title: c.title || c.fileName || 'Untitled',
    caption: c.description || c.aiCaption || undefined,
    hashtags: Array.isArray(c.aiHashtags) ? c.aiHashtags : [],
    mediaUrls: c.storageUrl ? [c.storageUrl] : [],
    thumbnailUrl: c.thumbnailUrl || undefined,
    tags: Array.isArray(c.tags) ? c.tags : [],
    // status has no DB column; persisted content is treated as 'ready'.
    status: 'ready' as const,
    sourceType: sourceToUi(c.source),
    metadata: {
      originalFilename: c.fileName || undefined,
      fileSize: typeof c.fileSize === 'number' ? c.fileSize : undefined,
      mimeType: c.mimeType || undefined,
      dimensions:
        typeof c.width === 'number' && typeof c.height === 'number'
          ? { width: c.width, height: c.height }
          : undefined,
      duration: typeof c.duration === 'number' ? c.duration : undefined,
    },
    createdAt:
      c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    updatedAt:
      c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
  };
}

/**
 * GET /api/content
 *
 * List all content library items for the current user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const items = await prisma.content.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(items.map(serializeContent));
  } catch (error) {
    console.error('GET /api/content failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content
 *
 * Create a content library item for the current user.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    // Validate the minimum the UI sends.
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    if (!body.type) {
      return NextResponse.json({ error: 'Content type is required' }, { status: 400 });
    }

    const mediaUrls: string[] = Array.isArray(body.mediaUrls) ? body.mediaUrls : [];
    const metadata = body.metadata || {};

    const created = await prisma.content.create({
      data: {
        userId,
        type: typeToDb(body.type) as any,
        title: body.title || null,
        description: body.caption || null,
        // Required columns — derive sensible defaults for non-file content.
        fileName: metadata.originalFilename || body.title || 'untitled',
        fileSize: typeof metadata.fileSize === 'number' ? metadata.fileSize : 0,
        mimeType: metadata.mimeType || defaultMime(body.type),
        storageUrl: mediaUrls[0] || body.thumbnailUrl || '',
        thumbnailUrl: body.thumbnailUrl || null,
        width: metadata.dimensions?.width ?? null,
        height: metadata.dimensions?.height ?? null,
        duration: typeof metadata.duration === 'number' ? metadata.duration : null,
        tags: Array.isArray(body.tags) ? body.tags : [],
        source: sourceToDb(body.sourceType) as any,
        aiHashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
      },
    });

    return NextResponse.json(serializeContent(created), { status: 201 });
  } catch (error) {
    console.error('POST /api/content failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create content' },
      { status: 500 }
    );
  }
}
