import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { serializeContent } from '../route';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/content/[id]
 *
 * Update a content library item owned by the current user.
 *
 * NOTE: Only persistable fields are written. `status`, `folder`, `feedId` and
 * `scheduledFor` have no column on the `Content` model and are intentionally
 * ignored server-side (the client keeps them locally).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;
    const body = await req.json();

    // Ownership check
    const existing = await prisma.content.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const data: Record<string, any> = {};
    if (body.title !== undefined) data.title = body.title || null;
    if (body.caption !== undefined) data.description = body.caption || null;
    if (Array.isArray(body.hashtags)) data.aiHashtags = body.hashtags;
    if (Array.isArray(body.tags)) data.tags = body.tags;

    const updated = await prisma.content.update({
      where: { id },
      data,
    });

    return NextResponse.json(serializeContent(updated));
  } catch (error) {
    console.error('PATCH /api/content/[id] failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/[id]
 *
 * Delete a content library item owned by the current user.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    // Ownership check
    const existing = await prisma.content.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    await prisma.content.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/content/[id] failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
