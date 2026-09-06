import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDriveAccessToken, moveDriveFile } from '@/app/lib/google/drive';

export const dynamic = 'force-dynamic';

/**
 * POST /api/google/move  { fileId, toFolderId, fromFolderId }
 * Moves a Drive file between folders (e.g. to-post -> posted) so it never reposts.
 * Requires the full Drive write scope (re-consent after the scope upgrade).
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

  const { fileId, toFolderId, fromFolderId } = await req.json();
  if (!fileId || !toFolderId || !fromFolderId) {
    return NextResponse.json(
      { error: 'fileId, toFolderId and fromFolderId are required' },
      { status: 400 }
    );
  }

  try {
    const token = await getDriveAccessToken(user.id);
    await moveDriveFile(token, fileId, toFolderId, fromFolderId);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Move failed' }, { status: 500 });
  }
}
