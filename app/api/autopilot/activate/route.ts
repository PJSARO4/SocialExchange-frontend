import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jobQueue } from '@/lib/queue';

// Force dynamic rendering - don't try to pre-render at build time
export const dynamic = 'force-dynamic';

/**
 * Autopilot Activation API
 *
 * Activates autopilot mode for a feed and queues initial posts.
 */

interface AutopilotConfig {
  contentSource: 'library' | 'folder' | 'ai_generated';
  contentFolderId?: string;
  shuffleContent: boolean;
  repeatContent: boolean;
  postsPerDay: number;
  postingTimes: string[];
  activeDays: string[];
  timezone: string;
  captionMode: 'ai_generate' | 'templates' | 'manual_queue';
  captionTone: string;
  includeHashtags: boolean;
  hashtagCount: number;
  includeEmojis: boolean;
  includeCTA: boolean;
  ctaType: string;
  customCTA?: string;
  captionTemplates: string[];
  avoidDuplicates: boolean;
  minTimeBetweenPosts: number;
  pauseOnLowEngagement: boolean;
  engagementThreshold: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedId, config } = body as { feedId: string; config: AutopilotConfig };

    if (!feedId || !config) {
      return NextResponse.json(
        { error: 'feedId and config are required' },
        { status: 400 }
      );
    }

    // Get content from library
    const contentItems = await getContentForAutopilot(feedId, config);

    if (contentItems.length === 0 && config.contentSource === 'library') {
      return NextResponse.json(
        { error: 'No content available in library. Please upload content first.' },
        { status: 400 }
      );
    }

    // Calculate posting schedule for next 7 days
    const scheduledPosts = generateSchedule(config, contentItems, 7);

    // Queue all scheduled posts
    const queuedJobs = [];
    for (const post of scheduledPosts) {
      try {
        const jobId = await jobQueue.addJob(
          'PUBLISH_POST',
          {
            feedId,
            scheduledPostId: post.id,
            caption: post.caption,
            mediaUrls: post.mediaUrls,
            mediaType: post.mediaType,
            accessToken: '', // Will be fetched from feed at execution time
            instagramUserId: '',
          },
          {
            scheduledFor: post.scheduledFor,
            priority: 1,
          }
        );
        queuedJobs.push({ postId: post.id, jobId });
      } catch (error) {
        console.error('Failed to queue post:', error);
      }
    }

    // Update feed to autopilot mode
    try {
      await prisma.socialFeed.update({
        where: { id: feedId },
        data: {
          automationEnabled: true,
          controlMode: 'AUTOPILOT',
        },
      });
    } catch (dbError) {
      console.warn('Could not update feed in database:', dbError);
    }

    // Store autopilot config
    // In production, this would be stored in database
    // For now, we rely on localStorage on the client

    console.log(`🚀 Autopilot activated for feed ${feedId}`);
    console.log(`📅 Scheduled ${scheduledPosts.length} posts for next 7 days`);

    return NextResponse.json({
      success: true,
      message: 'Autopilot activated successfully',
      stats: {
        postsScheduled: scheduledPosts.length,
        nextPostAt: scheduledPosts[0]?.scheduledFor,
        contentRemaining: contentItems.length - scheduledPosts.length,
      },
      queuedJobs,
    });
  } catch (error: any) {
    console.error('Autopilot activation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get content items for autopilot
async function getContentForAutopilot(
  feedId: string,
  config: AutopilotConfig
): Promise<any[]> {
  // In production, fetch from database
  // For now, return mock data or empty array

  // Try to get from localStorage via a different mechanism
  // This is a placeholder - in production, content would be in database

  return [];
}

// Generate posting schedule
function generateSchedule(
  config: AutopilotConfig,
  contentItems: any[],
  days: number
): any[] {
  const schedule: any[] = [];
  const now = new Date();

  // Map day names to numbers
  const dayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  const activeDayNumbers = config.activeDays.map((d) => dayMap[d]);

  // Shuffle content if configured
  let orderedContent = [...contentItems];
  if (config.shuffleContent) {
    orderedContent = shuffleArray(orderedContent);
  }

  let contentIndex = 0;

  // Generate schedule for each day
  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);

    // Skip if not an active day
    if (!activeDayNumbers.includes(date.getDay())) {
      continue;
    }

    // Schedule posts for each posting time
    for (const time of config.postingTimes) {
      // Skip if we've run out of content and not repeating
      if (contentIndex >= orderedContent.length) {
        if (config.repeatContent) {
          contentIndex = 0;
          if (config.shuffleContent) {
            orderedContent = shuffleArray(orderedContent);
          }
        } else {
          break;
        }
      }

      const [hours, minutes] = time.split(':').map(Number);
      const scheduledFor = new Date(date);
      scheduledFor.setHours(hours, minutes, 0, 0);

      // Skip if in the past
      if (scheduledFor <= now) {
        continue;
      }

      const content = orderedContent[contentIndex] || null;

      schedule.push({
        id: `autopilot_${Date.now()}_${schedule.length}`,
        feedId: '',
        mediaUrls: content?.url ? [content.url] : [],
        mediaType: content?.type?.toUpperCase() || 'IMAGE',
        caption: '', // Will be generated at post time
        scheduledFor,
        status: 'PENDING',
        source: 'autopilot',
      });

      contentIndex++;
    }
  }

  return schedule;
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// GET - Get autopilot status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feedId = searchParams.get('feed_id');

  if (!feedId) {
    return NextResponse.json({ error: 'feed_id is required' }, { status: 400 });
  }

  try {
    // Get feed status
    const feed = await prisma.socialFeed.findUnique({
      where: { id: feedId },
      select: {
        automationEnabled: true,
        controlMode: true,
      },
    });

    // Get queued posts count
    const queueStats = await jobQueue.getStats();

    // Get upcoming scheduled posts
    const upcomingPosts = await jobQueue.getJobsForFeed(feedId, {
      status: 'PENDING',
      limit: 10,
    });

    return NextResponse.json({
      isActive: feed?.automationEnabled && feed?.controlMode === 'AUTOPILOT',
      controlMode: feed?.controlMode,
      queueStats,
      upcomingPosts: upcomingPosts.map((job) => ({
        id: job.id,
        scheduledFor: job.scheduledFor,
        status: job.status,
      })),
    });
  } catch (error: any) {
    console.error('Autopilot status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Deactivate autopilot
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feedId = searchParams.get('feed_id');

  if (!feedId) {
    return NextResponse.json({ error: 'feed_id is required' }, { status: 400 });
  }

  try {
    // Update feed to manual mode
    await prisma.socialFeed.update({
      where: { id: feedId },
      data: {
        automationEnabled: false,
        controlMode: 'MANUAL',
      },
    });

    // Cancel pending autopilot jobs
    const pendingJobs = await jobQueue.getJobsForFeed(feedId, { status: 'PENDING' });
    let cancelledCount = 0;

    for (const job of pendingJobs) {
      const cancelled = await jobQueue.cancelJob(job.id);
      if (cancelled) cancelledCount++;
    }

    console.log(`⏸️ Autopilot deactivated for feed ${feedId}`);
    console.log(`🗑️ Cancelled ${cancelledCount} pending jobs`);

    return NextResponse.json({
      success: true,
      message: 'Autopilot deactivated',
      cancelledJobs: cancelledCount,
    });
  } catch (error: any) {
    console.error('Autopilot deactivation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
