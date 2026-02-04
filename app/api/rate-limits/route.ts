import { NextRequest, NextResponse } from 'next/server';

import { rateLimiter } from '@/lib/rate-limit';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * Rate Limits API
 *
 * Provides endpoints for checking and managing rate limits.
 */

// GET - Get rate limit status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feedId = searchParams.get('feed_id');
  const actionType = searchParams.get('action_type');

  if (!feedId) {
    return NextResponse.json({ error: 'feed_id is required' }, { status: 400 });
  }

  try {
    if (actionType) {
      // Get status for specific action type
      const status = await rateLimiter.checkLimit(feedId, actionType.toUpperCase() as any);
      return NextResponse.json({
        action_type: actionType,
        status,
      });
    } else {
      // Get status for all action types
      const allLimits = await rateLimiter.getAllLimits(feedId);
      const dailyUsage = await rateLimiter.getDailyUsage(feedId);

      return NextResponse.json({
        limits: allLimits,
        daily_usage: dailyUsage,
      });
    }
  } catch (error: any) {
    console.error('Rate limits GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Record an action (increments counters)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feed_id, action_type } = body;

    if (!feed_id || !action_type) {
      return NextResponse.json(
        { error: 'feed_id and action_type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['LIKE', 'COMMENT', 'FOLLOW', 'UNFOLLOW', 'DM', 'PUBLISH'];
    if (!validTypes.includes(action_type.toUpperCase())) {
      return NextResponse.json(
        { error: `Invalid action_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const status = await rateLimiter.recordAction(feed_id, action_type.toUpperCase() as any);

    return NextResponse.json({
      recorded: true,
      status,
    });
  } catch (error: any) {
    console.error('Rate limits POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update custom limits
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { feed_id, action_type, daily_limit, hourly_limit } = body;

    if (!feed_id || !action_type) {
      return NextResponse.json(
        { error: 'feed_id and action_type are required' },
        { status: 400 }
      );
    }

    await rateLimiter.setCustomLimits(feed_id, action_type.toUpperCase() as any, {
      daily: daily_limit,
      hourly: hourly_limit,
    });

    const status = await rateLimiter.checkLimit(feed_id, action_type.toUpperCase() as any);

    return NextResponse.json({
      updated: true,
      status,
    });
  } catch (error: any) {
    console.error('Rate limits PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Clear a block
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feedId = searchParams.get('feed_id');
  const actionType = searchParams.get('action_type');

  if (!feedId || !actionType) {
    return NextResponse.json(
      { error: 'feed_id and action_type are required' },
      { status: 400 }
    );
  }

  try {
    await rateLimiter.clearBlock(feedId, actionType.toUpperCase() as any);
    const status = await rateLimiter.checkLimit(feedId, actionType.toUpperCase() as any);

    return NextResponse.json({
      cleared: true,
      status,
    });
  } catch (error: any) {
    console.error('Rate limits DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
