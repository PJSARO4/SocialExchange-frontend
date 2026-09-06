import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDriveAccessToken, listDrive } from '@/app/lib/google/drive';

export const dynamic = 'force-dynamic';

/**
 * GET /api/google/files?folderId=...
 * Lists folders + files inside a Google Drive folder (root if omitted).
 * Used by the Drive folder/file picker in the chain builder.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  try {
    const token = await getDriveAccessToken(user.id);
    const folderId = req.nextUrl.searchParams.get('folderId') || undefined;
    const items = await listDrive(token, folderId);
    return NextResponse.json({ items, folderId: folderId || 'root' });
  } catch (e: any) {
    const notConnected = /not connected/i.test(e?.message || '');
    return NextResponse.json(
      { error: e?.message || 'Failed to list Drive' },
      { status: notConnected ? 403 : 500 }
    );
  }
}
