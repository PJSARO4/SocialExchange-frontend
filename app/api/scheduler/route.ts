import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jobQueue } from '@/lib/queue';

// Force dynamic rendering - prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

/**
 * Scheduler API
 *
 * Handles scheduled posts with database persistence and job queue integration.
 * Posts are stored in PostgreSQL (ScheduledPostNew model) and publishing jobs
 * are queued for the cron worker to process.
 *
 * The worker fetches access tokens from the SocialFeed record at execution time,
 * so we don't store tokens in the scheduled post or job payload.
 */

// GET - List scheduled posts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const feedId = searchParams.get('feed_id');
  const status = searchParams.get('status');

  if (!feedId) {
    return NextResponse.json({ error: 'feed_id is required' }, { status: 400 });
  }

  try {
    const posts = await prisma.scheduledPostNew.findMany({
      where: {
        feedId,
        ...(status && { status: status.toUpperCase() as any }),
      },
      orderBy: { scheduledFor: 'asc' },
    });

    // Map to API response format
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      feed_id: post.feedId,
      platform: 'instagram',
      content: post.caption,
      media_urls: post.mediaUrls,
      media_type: post.mediaType,
      scheduled_time: post.scheduledFor.toISOString(),
      status: post.status.toLowerCase(),
      error_message: post.lastError,
      published_media_id: post.instagramPostId,
      created_at: post.createdAt.toISOString(),
      updated_at: post.updatedAt.toISOString(),
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error: any) {
    console.error('Scheduler GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new scheduled post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feed_id, platform, content, media_urls, media_type, scheduled_time } = body;

    // Validate required fields
    if (!feed_id || !platform || !scheduled_time) {
      return NextResponse.json(
        { error: 'feed_id, platform, and scheduled_time are required' },
        { status: 400 }
      );
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduled_time);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      );
    }

    // Verify the feed exists and is connected
    const feed = await prisma.socialFeed.findUnique({
      where: { id: feed_id },
      select: { id: true, isConnected: true, platformAccountId: true, accessToken: true },
    });

    if (!feed) {
      return NextResponse.json({ error: 'Feed not found' }, { status: 404 });
    }

    if (!feed.isConnected || !feed.accessToken) {
      return NextResponse.json(
        { error: 'Feed is not connected or missing access token' },
        { status: 400 }
      );
    }

    // Create the scheduled post in database
    const post = await prisma.scheduledPostNew.create({
      data: {
        feedId: feed_id,
        caption: content || '',
        mediaUrls: media_urls || [],
        mediaType: (media_type || 'IMAGE').toUpperCase() as any,
        scheduledFor: scheduledDate,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        status: 'PENDING',
      },
    });

    // Queue the job for the worker
    // Worker will fetch access token from the Feed record at execution time
    try {
      const jobId = await jobQueue.addJob(
        'PUBLISH_POST',
        {
          feedId: feed_id,
          scheduledPostId: post.id,
          caption: post.caption,
          mediaUrls: post.mediaUrls,
          mediaType: post.mediaType,
          // Worker fetches these from the Feed record at execution time
          accessToken: feed.accessToken,
          instagramUserId: feed.platformAccountId,
        },
        {
          scheduledFor: scheduledDate,
          maxAttempts: 3,
        }
      );

      // Update post with job ID and status
      await prisma.scheduledPostNew.update({
        where: { id: post.id },
        data: {
          jobId,
          status: 'QUEUED',
        },
      });
    } catch (queueError) {
      console.warn('Failed to queue job:', queueError);
      // Post is still saved, just not queued yet
    }

    console.log('[scheduler] Scheduled new post:', {
      id: post.id,
      scheduled_time: post.scheduledFor,
      media_type: post.mediaType,
    });

    // Return API-formatted response
    const formattedPost = {
      id: post.id,
      feed_id: post.feedId,
      platform: 'instagram',
      content: post.caption,
      media_urls: post.mediaUrls,
      media_type: post.mediaType,
      scheduled_time: post.scheduledFor.toISOString(),
      status: post.status.toLowerCase(),
      created_at: post.createdAt.toISOString(),
      updated_at: post.updatedAt.toISOString(),
    };

    return NextResponse.json({ post: formattedPost }, { status: 201 });
  } catch (error: any) {
    console.error('Scheduler POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a scheduled post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const existingPost = await prisma.scheduledPostNew.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Don't allow updating published posts
    if (existingPost.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot update a published post' },
        { status: 400 }
      );
    }

    // Map update fields
    const updateData: any = {};
    if (updates.content !== undefined) updateData.caption = updates.content;
    if (updates.media_urls !== undefined) updateData.mediaUrls = updates.media_urls;
    if (updates.media_type !== undefined) updateData.mediaType = updates.media_type.toUpperCase();
    if (updates.scheduled_time !== undefined) {
      const scheduledDate = new Date(updates.scheduled_time);
      if (scheduledDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        );
      }
      updateData.scheduledFor = scheduledDate;
    }
    if (updates.status !== undefined) updateData.status = updates.status.toUpperCase();

    const updatedPost = await prisma.scheduledPostNew.update({
      where: { id },
      data: updateData,
    });

    // If time changed, cancel old job and create a new one
    if (updates.scheduled_time && existingPost.jobId) {
      try {
        await jobQueue.cancelJob(existingPost.jobId);

        // Fetch feed details for the new job
        const feed = await prisma.socialFeed.findUnique({
          where: { id: updatedPost.feedId },
          select: { platformAccountId: true, accessToken: true },
        });

        const jobId = await jobQueue.addJob(
          'PUBLISH_POST',
          {
            feedId: updatedPost.feedId,
            scheduledPostId: updatedPost.id,
            caption: updatedPost.caption,
            mediaUrls: updatedPost.mediaUrls,
            mediaType: updatedPost.mediaType,
            accessToken: feed?.accessToken || '',
            instagramUserId: feed?.platformAccountId || '',
          },
          {
            scheduledFor: updatedPost.scheduledFor,
          }
        );

        await prisma.scheduledPostNew.update({
          where: { id },
          data: { jobId },
        });
      } catch (rescheduleError) {
        console.warn('Failed to reschedule job:', rescheduleError);
      }
    }

    const formattedPost = {
      id: updatedPost.id,
      feed_id: updatedPost.feedId,
      platform: 'instagram',
      content: updatedPost.caption,
      media_urls: updatedPost.mediaUrls,
      media_type: updatedPost.mediaType,
      scheduled_time: updatedPost.scheduledFor.toISOString(),
      status: updatedPost.status.toLowerCase(),
      error_message: updatedPost.lastError,
      published_media_id: updatedPost.instagramPostId,
      created_at: updatedPost.createdAt.toISOString(),
      updated_at: updatedPost.updatedAt.toISOString(),
    };

    return NextResponse.json({ post: formattedPost });
  } catch (error: any) {
    console.error('Scheduler PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a scheduled post
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
  }

  try {
    const existingPost = await prisma.scheduledPostNew.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Don't allow deleting published posts
    if (existingPost.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot delete a published post' },
        { status: 400 }
      );
    }

    // Cancel the job if queued
    if (existingPost.jobId) {
      try {
        await jobQueue.cancelJob(existingPost.jobId);
      } catch (cancelError) {
        console.warn('Failed to cancel job:', cancelError);
      }
    }

    await prisma.scheduledPostNew.delete({
      where: { id },
    });

    console.log('[scheduler] Deleted scheduled post:', id);

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error: any) {
    console.error('Scheduler DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
