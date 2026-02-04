/**
 * Rate Limiter for Instagram API actions
 *
 * Tracks daily usage to stay within Instagram's limits:
 * - Likes: ~150-200 per day
 * - Comments: ~30-50 per day
 * - Follows: ~50-100 per day
 * - DMs: ~20-50 per day
 */

import { prisma } from './prisma';

export interface DailyUsage {
  likes: number;
  comments: number;
  follows: number;
  dms: number;
}

class RateLimiter {
  /**
   * Get daily usage stats for a feed
   */
  async getDailyUsage(feedId: string): Promise<DailyUsage> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Count actions by type for today
      const actions = await prisma.automationAction.groupBy({
        by: ['actionType'],
        where: {
          feedId,
          createdAt: {
            gte: today,
          },
          status: 'COMPLETED',
        },
        _count: {
          id: true,
        },
      });

      // Build usage object
      const usage: DailyUsage = {
        likes: 0,
        comments: 0,
        follows: 0,
        dms: 0,
      };

      for (const action of actions) {
        const count = action._count.id;
        switch (action.actionType) {
          case 'LIKE':
            usage.likes = count;
            break;
          case 'COMMENT':
            usage.comments = count;
            break;
          case 'FOLLOW':
            usage.follows = count;
            break;
          case 'DM':
            usage.dms = count;
            break;
        }
      }

      return usage;
    } catch (error) {
      console.error('Error getting daily usage:', error);
      // Return zeros if there's an error (e.g., table doesn't exist yet)
      return {
        likes: 0,
        comments: 0,
        follows: 0,
        dms: 0,
      };
    }
  }

  /**
   * Check if an action type is within limits
   */
  async canPerformAction(feedId: string, actionType: keyof DailyUsage): Promise<boolean> {
    const limits: DailyUsage = {
      likes: 150,
      comments: 30,
      follows: 50,
      dms: 20,
    };

    const usage = await this.getDailyUsage(feedId);
    return usage[actionType] < limits[actionType];
  }
}

export const rateLimiter = new RateLimiter();
