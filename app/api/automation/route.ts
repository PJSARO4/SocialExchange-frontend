import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiter } from '@/lib/rate-limit';
import {
  getTenantUser,
  notFound,
  resolveOwnedAutomationRule,
  resolveOwnedFeed,
  unauthorized,
} from '@/lib/security/tenant';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';


/**
 * Automation Engine API
 *
 * Manages automation rules with database persistence and rate limiting.
 *
 * IMPORTANT: Instagram has strict limits on automated actions:
 * - Likes: ~150-200 per day
 * - Comments: ~30-50 per day
 * - Follows: ~50-100 per day
 * - DMs: ~20-50 per day
 *
 * Exceeding these can result in temporary blocks or account suspension.
 *
 * SEC-1: all four methods were previously unauthenticated. Any caller who knew
 * a feed_id could read, create, enable, disable or delete that feed's
 * automation rules — rules that drive real actions against a real Instagram
 * account. Rule semantics and the rate limiter are unchanged; only the gate is
 * new.
 */

// Default rules to initialize for new feeds
const DEFAULT_RULES = [
  {
    name: 'Auto-Like New Followers',
    type: 'ENGAGEMENT' as const,
    settings: {
      likes_per_user: 3,
      delay_seconds: 30,
    },
  },
  {
    name: 'Welcome DM',
    type: 'DM' as const,
    settings: {
      message: 'Hey! Thanks for the follow 🙏 Let me know if you have any questions!',
      delay_minutes: 5,
    },
  },
  {
    name: 'Hashtag Engagement',
    type: 'ENGAGEMENT' as const,
    settings: {
      hashtags: ['photography', 'lifestyle', 'travel'],
      actions_per_hour: 10,
      action_types: ['like'],
    },
  },
];

// Initialize default rules for a feed
async function initializeDefaultRules(feedId: string) {
  const existingRules = await prisma.automationRule.count({
    where: { feedId },
  });

  if (existingRules > 0) return;

  for (const rule of DEFAULT_RULES) {
    await prisma.automationRule.create({
      data: {
        feedId,
        name: rule.name,
        type: rule.type,
        enabled: false,
        settings: rule.settings,
        actionsToday: 0,
        actionsTotal: 0,
        statsResetAt: new Date(),
      },
    });
  }
}

// GET - List automation rules
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feedId = searchParams.get('feed_id');
  const includeActions = searchParams.get('include_actions') === 'true';

  if (!feedId) {
    return NextResponse.json({ error: 'feed_id is required' }, { status: 400 });
  }

  const user = await getTenantUser();
  if (!user) return unauthorized();

  // Ownership first: initializeDefaultRules() below WRITES rows, so this must
  // never run for a feed the caller does not own.
  const ownedFeed = await resolveOwnedFeed(user.id, feedId);
  if (!ownedFeed) return notFound('Feed');

  try {
    // Initialize default rules if none exist
    await initializeDefaultRules(feedId);

    // Get rules
    const rules = await prisma.automationRule.findMany({
      where: { feedId },
      orderBy: { createdAt: 'asc' },
    });

    // Get rate limit status
    const dailyUsage = await rateLimiter.getDailyUsage(feedId);

    // Format response
    const formattedRules = rules.map((rule) => ({
      id: rule.id,
      feed_id: rule.feedId,
      name: rule.name,
      type: rule.type.toLowerCase(),
      enabled: rule.enabled,
      settings: rule.settings,
      stats: {
        actions_today: rule.actionsToday,
        actions_total: rule.actionsTotal,
        last_run: rule.lastRunAt?.toISOString(),
      },
      created_at: rule.createdAt.toISOString(),
      updated_at: rule.updatedAt.toISOString(),
    }));

    const response: any = {
      rules: formattedRules,
      daily_limits: {
        likes: 150,
        comments: 30,
        follows: 50,
        dms: 20,
      },
      daily_usage: dailyUsage,
    };

    if (includeActions) {
      const recentActions = await prisma.automationAction.findMany({
        where: { feedId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      response.recent_actions = recentActions.map((action) => ({
        id: action.id,
        rule_id: action.ruleId,
        feed_id: action.feedId,
        type: action.actionType.toLowerCase(),
        target: action.targetUsername || action.targetId,
        status: action.status.toLowerCase(),
        executed_at: action.executedAt?.toISOString(),
        error_message: action.errorMessage,
      }));
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Automation GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new automation rule
export async function POST(request: NextRequest) {
  const user = await getTenantUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { feed_id, name, type, settings } = body;

    if (!feed_id || !name || !type) {
      return NextResponse.json(
        { error: 'feed_id, name, and type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['engagement', 'follow', 'dm', 'comment'];
    if (!validTypes.includes(type.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const ownedFeed = await resolveOwnedFeed(user.id, feed_id);
    if (!ownedFeed) return notFound('Feed');

    const rule = await prisma.automationRule.create({
      data: {
        feedId: feed_id,
        name,
        type: type.toUpperCase() as any,
        enabled: false,
        settings: settings || {},
        actionsToday: 0,
        actionsTotal: 0,
        statsResetAt: new Date(),
      },
    });

    console.log('🤖 Created automation rule:', {
      id: rule.id,
      name: rule.name,
      type: rule.type,
    });

    const formattedRule = {
      id: rule.id,
      feed_id: rule.feedId,
      name: rule.name,
      type: rule.type.toLowerCase(),
      enabled: rule.enabled,
      settings: rule.settings,
      stats: {
        actions_today: rule.actionsToday,
        actions_total: rule.actionsTotal,
      },
      created_at: rule.createdAt.toISOString(),
      updated_at: rule.updatedAt.toISOString(),
    };

    return NextResponse.json({ rule: formattedRule }, { status: 201 });
  } catch (error: any) {
    console.error('Automation POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update an automation rule
export async function PUT(request: NextRequest) {
  const user = await getTenantUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    // Ownership is established through the rule's owning feed.
    const existingRule = await resolveOwnedAutomationRule(user.id, id);

    if (!existingRule) {
      return notFound('Rule');
    }

    // Build update data
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
    if (updates.settings !== undefined) updateData.settings = updates.settings;

    const updatedRule = await prisma.automationRule.update({
      where: { id },
      data: updateData,
    });

    console.log('🤖 Updated automation rule:', {
      id: updatedRule.id,
      name: updatedRule.name,
      enabled: updatedRule.enabled,
    });

    const formattedRule = {
      id: updatedRule.id,
      feed_id: updatedRule.feedId,
      name: updatedRule.name,
      type: updatedRule.type.toLowerCase(),
      enabled: updatedRule.enabled,
      settings: updatedRule.settings,
      stats: {
        actions_today: updatedRule.actionsToday,
        actions_total: updatedRule.actionsTotal,
        last_run: updatedRule.lastRunAt?.toISOString(),
      },
      created_at: updatedRule.createdAt.toISOString(),
      updated_at: updatedRule.updatedAt.toISOString(),
    };

    return NextResponse.json({ rule: formattedRule });
  } catch (error: any) {
    console.error('Automation PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete an automation rule
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
  }

  const user = await getTenantUser();
  if (!user) return unauthorized();

  try {
    const rule = await resolveOwnedAutomationRule(user.id, id);

    if (!rule) {
      return notFound('Rule');
    }

    // Delete associated actions first
    await prisma.automationAction.deleteMany({
      where: { ruleId: id },
    });

    // Delete the rule
    await prisma.automationRule.delete({
      where: { id },
    });

    console.log('🗑️ Deleted automation rule:', id);

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error: any) {
    console.error('Automation DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
