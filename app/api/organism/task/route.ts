import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ============================================
// POST /api/organism/task
// Task management + approval requests
// ============================================

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, description, behaviorId, userId } = await req.json();

    if (type === 'approval_request') {
      // Store approval request (future: save to Neon DB)
      console.log(
        `[SYN] Approval request from user ${userId}: behavior "${behaviorId}" - ${description}`
      );

      return NextResponse.json({
        success: true,
        message: 'Approval request submitted. A developer will review it.',
        requestId: `req-${Date.now()}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Task recorded',
    });
  } catch (err) {
    console.error('[SYN] Task route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/organism/task
// Get pending approval requests (founder dashboard)
// ============================================

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Future: query Neon DB for pending requests
  return NextResponse.json({
    pending: [],
    message: 'No pending approval requests',
  });
}
