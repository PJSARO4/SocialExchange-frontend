import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * POST /api/content/upload - Upload a file to Vercel Blob and save to Content model
 *
 * Accepts multipart form data with:
 * - file: The file to upload
 * - title: Optional title
 * - feedId: Optional feed ID to associate with
 * - tags: Optional comma-separated tags
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const feedId = formData.get('feedId') as string | null;
    const tagsRaw = formData.get('tags') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Determine content type
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: 'Only image and video files are supported' },
        { status: 400 }
      );
    }

    const contentType = isVideo ? 'VIDEO' : 'IMAGE';

    // Upload to Vercel Blob
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `content/${session.user.id}/${timestamp}-${safeName}`;

    const blob = await put(pathname, file, {
      access: 'public',
      contentType: file.type,
    });

    // Parse tags
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Save to database
    const content = await prisma.content.create({
      data: {
        userId: session.user.id,
        type: contentType as any,
        title: title || file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storageUrl: blob.url,
        tags,
        source: 'UPLOAD',
      },
    });

    return NextResponse.json({
      content: {
        id: content.id,
        type: content.type,
        title: content.title,
        fileName: content.fileName,
        fileSize: content.fileSize,
        mimeType: content.mimeType,
        storageUrl: content.storageUrl,
        tags: content.tags,
        createdAt: content.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[content/upload] Error:', error);

    // Provide helpful error for missing BLOB_READ_WRITE_TOKEN
    if (error.message?.includes('BLOB_READ_WRITE_TOKEN') || error.message?.includes('BlobAccessError')) {
      return NextResponse.json(
        {
          error: 'Blob storage not configured',
          details: 'Set BLOB_READ_WRITE_TOKEN in your environment variables. Get one from: Vercel Dashboard > Storage > Create Blob Store',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/upload - List uploaded content for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = { userId: session.user.id };
    if (type) {
      where.type = type.toUpperCase();
    }

    const [content, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({
      content,
      total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('[content/upload] Error listing content:', error);
    return NextResponse.json(
      { error: 'Failed to list content', details: error.message },
      { status: 500 }
    );
  }
}
