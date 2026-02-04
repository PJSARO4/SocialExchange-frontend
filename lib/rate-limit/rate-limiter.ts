/**
 * Rate Limiter
 *
 * Manages rate limiting for Instagram API actions.
 * Tracks per-feed limits and enforces Instagram's API restrictions.
 */

import { prisma } from '../prisma';
import { INSTAGRAM_RATE_LIMITS } from '../queue/types';

type ActionType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'UNFOLLOW' | 'DM' | 'PUBLISH';

interface RateLimitStatus {
  allowed: boolean;
  remaining: {
    daily: number;
    hourly: number;
  };
  resetTimes: {
    daily: Date;
    hourly: Date;
  };
  blockedUntil?: Date;
  blockReason?: string;
}

export class RateLimiter {
  /**
   * Check if an action is allowed
   */
  async checkLimit(feedId: string, actionType: ActionType): Promise<RateLimitStatus> {
    const limit = await this.getOrCreateLimit(feedId, actionType);
    const now = new Date();

    // Reset counters if needed
    await this.resetCountersIfNeeded(limit, now);

    // Refresh the limit after potential reset
    const updatedLimit = await prisma.rateLimit.findUnique({
      where: { id: limit.id },
    });

    if (!updatedLimit) {
      throw new Error('Rate limit record not found');
    }

    // Check if blocked
    if (updatedLimit.blockedUntil && updatedLimit.blockedUntil > now) {
      return {
        allowed: false,
        remaining: {
          daily: 0,
          hourly: 0,
        },
        resetTimes: {
          daily: updatedLimit.dailyResetAt,
          hourly: updatedLimit.hourlyResetAt,
        },
        blockedUntil: updatedLimit.blockedUntil,
        blockReason: updatedLimit.blockReason || 'Rate limit exceeded',
      };
    }

    // Check limits
    const dailyRemaining = updatedLimit.dailyLimit - updatedLimit.dailyCount;
    const hourlyRemaining = updatedLimit.hourlyLimit - updatedLimit.hourlyCount;
    const allowed = dailyRemaining > 0 && hourlyRemaining > 0;

    return {
      allowed,
      remaining: {
        daily: Math.max(0, dailyRemaining),
        hourly: Math.max(0, hourlyRemaining),
      },
      resetTimes: {
        daily: updatedLimit.dailyResetAt,
        hourly: updatedLimit.hourlyResetAt,
      },
    };
  }

  /**
   * Record an action and update counters
   */
  async recordAction(feedId: string, actionType: ActionType): Promise<RateLimitStatus> {
    const limit = await this.getOrCreateLimit(feedId, actionType);
    const now = new Date();

    // Reset counters if needed first
    await this.resetCountersIfNeeded(limit, now);

    // Increment counters
    const updated = await prisma.rateLimit.update({
      where: { id: limit.id },
      data: {
        dailyCount: { increment: 1 },
        hourlyCount: { increment: 1 },
      },
    });

    // Check if we need to block
    const dailyRemaining = updated.dailyLimit - updated.dailyCount;
    const hourlyRemaining = updated.hourlyLimit - updated.hourlyCount;

    if (dailyRemaining <= 0 || hourlyRemaining <= 0) {
      // Block until the next reset
      const blockUntil = hourlyRemaining <= 0 ? updated.hourlyResetAt : updated.dailyResetAt;

      await prisma.rateLimit.update({
        where: { id: limit.id },
        data: {
          blockedUntil: blockUntil,
          blockReason: hourlyRemaining <= 0 ? 'Hourly limit reached' : 'Daily limit reached',
        },
      });
    }

    return this.checkLimit(feedId, actionType);
  }

  /**
   * Get rate limit status for all action types
   */
  async getAllLimits(feedId: string): Promise<Record<ActionType, RateLimitStatus>> {
    const actionTypes: ActionType[] = ['LIKE', 'COMMENT', 'FOLLOW', 'DM', 'PUBLISH'];
    const result: Partial<Record<ActionType, RateLimitStatus>> = {};

    for (const type of actionTypes) {
      result[type] = await this.checkLimit(feedId, type);
    }

    return result as Record<ActionType, RateLimitStatus>;
  }

  /**
   * Set custom limits for a feed
   */
  async setCustomLimits(
    feedId: string,
    actionType: ActionType,
    limits: { daily?: number; hourly?: number }
  ): Promise<void> {
    const limit = await this.getOrCreateLimit(feedId, actionType);

    await prisma.rateLimit.update({
      where: { id: limit.id },
      data: {
        ...(limits.daily !== undefined && { dailyLimit: limits.daily }),
        ...(limits.hourly !== undefined && { hourlyLimit: limits.hourly }),
      },
    });
  }

  /**
   * Clear a block for a feed
   */
  async clearBlock(feedId: string, actionType: ActionType): Promise<void> {
    await prisma.rateLimit.updateMany({
      where: { feedId, actionType },
      data: {
        blockedUntil: null,
        blockReason: null,
      },
    });
  }

  /**
   * Get daily usage summary for a feed
   */
  async getDailyUsage(feedId: string): Promise<{
    [key in ActionType]?: { used: number; limit: number; remaining: number };
  }> {
    const limits = await prisma.rateLimit.findMany({
      where: { feedId },
    });

    const result: any = {};
    for (const limit of limits) {
      result[limit.actionType] = {
        used: limit.dailyCount,
        limit: limit.dailyLimit,
        remaining: Math.max(0, limit.dailyLimit - limit.dailyCount),
      };
    }

    return result;
  }

  // Private helper methods

  private async getOrCreateLimit(feedId: string, actionType: ActionType) {
    const existing = await prisma.rateLimit.findUnique({
      where: {
        feedId_actionType: { feedId, actionType },
      },
    });

    if (existing) return existing;

    // Get default limits for this action type
    const defaultLimits = this.getDefaultLimits(actionType);
    const now = new Date();

    return prisma.rateLimit.create({
      data: {
        feedId,
        actionType,
        dailyLimit: defaultLimits.daily,
        hourlyLimit: defaultLimits.hourly,
        dailyResetAt: this.getNextDayStart(now),
        hourlyResetAt: this.getNextHourStart(now),
      },
    });
  }

  private getDefaultLimits(actionType: ActionType): { daily: number; hourly: number } {
    const limits = INSTAGRAM_RATE_LIMITS[actionType as keyof typeof INSTAGRAM_RATE_LIMITS];
    if (limits) {
      return limits;
    }
    // Default fallback
    return { daily: 50, hourly: 15 };
  }

  private async resetCountersIfNeeded(limit: any, now: Date): Promise<void> {
    const updates: any = {};

    // Check daily reset
    if (now >= limit.dailyResetAt) {
      updates.dailyCount = 0;
      updates.dailyResetAt = this.getNextDayStart(now);
    }

    // Check hourly reset
    if (now >= limit.hourlyResetAt) {
      updates.hourlyCount = 0;
      updates.hourlyResetAt = this.getNextHourStart(now);
    }

    // Clear block if reset time has passed
    if (limit.blockedUntil && now >= limit.blockedUntil) {
      updates.blockedUntil = null;
      updates.blockReason = null;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.rateLimit.update({
        where: { id: limit.id },
        data: updates,
      });
    }
  }

  private getNextDayStart(from: Date): Date {
    const next = new Date(from);
    next.setUTCHours(0, 0, 0, 0);
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  private getNextHourStart(from: Date): Date {
    const next = new Date(from);
    next.setUTCMinutes(0, 0, 0);
    next.setUTCHours(next.getUTCHours() + 1);
    return next;
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
