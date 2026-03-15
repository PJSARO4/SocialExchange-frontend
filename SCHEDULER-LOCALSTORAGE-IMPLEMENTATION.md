# localStorage-Based Scheduler Implementation

## Overview

This document describes the new localStorage-based scheduling system that allows the Social Exchange platform to schedule Instagram posts in demo mode without requiring a Prisma/PostgreSQL database.

## Files Created/Modified

### New File: `app/cockpit/my-e-assets/my-feeds/lib/scheduler-store.ts`

A complete localStorage-based scheduler store that replaces API calls during development.

**Key Features:**
- Stores scheduled posts in localStorage under key `socialexchange_scheduled_posts`
- Each post is a `ScheduledPost` object with all required metadata
- Automatic polling every 30 seconds to publish due posts
- Integration with existing Instagram publish API
- Timezone-aware scheduling

**Exported Functions:**

1. **getScheduledPosts(feedId?: string): ScheduledPost[]**
   - Returns all scheduled posts, optionally filtered by feedId
   - Safely parses localStorage data

2. **addScheduledPost(post): ScheduledPost**
   - Creates a new scheduled post with auto-generated ID
   - Stores in localStorage
   - Returns the created post object

3. **updateScheduledPost(id, updates): ScheduledPost | null**
   - Updates an existing post with partial updates
   - Returns null if post not found

4. **removeScheduledPost(id): boolean**
   - Deletes a scheduled post
   - Returns true if deleted, false if not found

5. **getUpcomingPosts(feedId?: string): ScheduledPost[]**
   - Returns only unscheduled posts that are in the future
   - Sorted by date ascending

6. **startSchedulerPolling(): void**
   - Starts 30-second polling to check for due posts
   - Automatically publishes when scheduledFor <= now
   - Idempotent (can be called multiple times safely)

7. **stopSchedulerPolling(): void**
   - Stops the polling interval

8. **isSchedulerPolling(): boolean**
   - Returns current polling status

### Modified File: `app/cockpit/my-e-assets/my-feeds/components/scheduler/SchedulerModal.tsx`

Updated to use the new localStorage scheduler instead of API calls.

**Key Changes:**
- Imports from `../../lib/scheduler-store`
- Added media type selector (IMAGE, VIDEO, REELS, CAROUSEL)
- Added media URL input for non-image types
- Automatic polling on modal mount
- Real-time status updates in UI
- Enhanced error display

## How It Works

### Creating a Scheduled Post

1. User fills form with caption, date, time, media type
2. `handleSchedulePost()` validates and calls `addScheduledPost()`
3. Post stored in localStorage with 'scheduled' status
4. UI updates to show post in queue/calendar

### Automatic Publishing

1. On modal mount, `startSchedulerPolling()` begins
2. Every 30 seconds, checks for due posts
3. When scheduledFor <= now:
   - Updates status to 'publishing'
   - Gets feed credentials from localStorage
   - Calls `/api/instagram/publish`
   - Updates status to 'published' or 'failed'
   - UI reflects status change

### Deleting a Post

1. User clicks delete on a 'scheduled' post
2. `handleDeletePost()` calls `removeScheduledPost()`
3. Post removed from localStorage
4. UI updates immediately

## Storage Format

```typescript
interface ScheduledPost {
  id: string;
  feedId: string;
  platform: string;
  caption: string;
  mediaUrls: string[];
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'REELS';
  scheduledFor: string; // ISO timestamp
  timezone: string;
  status: 'scheduled' | 'publishing' | 'published' | 'failed';
  createdAt: string;
  updatedAt: string;
  error?: string;
  instagramPostId?: string;
}
```

Stored at localStorage key: `socialexchange_scheduled_posts`

## Integration Points

### Feed Credentials
Reads from localStorage `socialexchange_feeds`:
- Extracts `accessToken` and `platformUserId`
- Used for Instagram API calls

### Notifications
Uses existing `useToast()` hook for user feedback

### Types
Uses existing `Feed` type from project

## API Route Not Modified

The existing `/api/scheduler` route with Prisma is kept intact for future database integration. The localStorage system is a drop-in replacement for demo mode.

## Testing

1. **Create post**: Fill form, schedule for future time
2. **View in queue**: Check Queue tab shows post
3. **View on calendar**: Check Calendar tab shows post
4. **Auto-publish**: Schedule for 1 min in future, wait 60 seconds
5. **Manual delete**: Delete a 'scheduled' post
6. **Different media types**: Test IMAGE, VIDEO, REELS

## Browser Console

Watch for these log messages:
- "📅 Added scheduled post" - Post created
- "▶️ Starting scheduler polling" - Polling started
- "📤 Publishing scheduled post" - Publishing in progress
- "✅ Post published successfully" - Success
- "🗑️ Removed scheduled post" - Deletion
