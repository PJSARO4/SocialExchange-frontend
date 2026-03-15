# Scheduler localStorage - Quick Start Guide

## What's New

Two files changed to enable localStorage-based scheduling:

1. **NEW**: `app/cockpit/my-e-assets/my-feeds/lib/scheduler-store.ts` (318 lines)
   - Complete scheduler with auto-publishing
   - Polls every 30 seconds for due posts
   - Stores posts in localStorage

2. **UPDATED**: `app/cockpit/my-e-assets/my-feeds/components/scheduler/SchedulerModal.tsx` (504 lines)
   - Uses scheduler-store instead of API
   - Added media type selector
   - Real-time status updates

## Quick Usage

### Create a Scheduled Post

1. Open SchedulerModal
2. Go to "Create Post" tab
3. Enter caption text
4. Select date (must be future)
5. Select time
6. Select media type (IMAGE is default)
7. For VIDEO/REELS: provide media URL
8. Click "Schedule Post"

### What Happens Next

- Post stored in localStorage
- Polling starts automatically
- Every 30 seconds, checks if any posts are due
- When time arrives: auto-publishes to Instagram
- Status changes: scheduled → publishing → published
- If error: status becomes failed (error shown)

### Delete a Post

- Click delete button on any "scheduled" post
- Post removed immediately

## Key Functions

**In scheduler-store.ts:**
- `getScheduledPosts(feedId?)` - Get all posts
- `addScheduledPost(post)` - Create post
- `removeScheduledPost(id)` - Delete post
- `startSchedulerPolling()` - Begin auto-publishing
- `stopSchedulerPolling()` - Stop polling

**In SchedulerModal.tsx:**
- `loadScheduledPosts()` - Load from localStorage
- `handleSchedulePost()` - Create new post
- `handleDeletePost()` - Delete post

## Data Storage

All posts stored as JSON in localStorage:
```
localStorage.getItem('socialexchange_scheduled_posts')
```

Each post has:
- id, feedId, platform
- caption (text content)
- mediaUrls[] (URLs array)
- mediaType ('IMAGE'|'VIDEO'|'REELS'|'CAROUSEL')
- scheduledFor (ISO timestamp)
- timezone
- status ('scheduled'|'publishing'|'published'|'failed')
- error (if failed)
- instagramPostId (if published)

## Auto-Publishing Flow

```
Every 30 seconds:
  1. Get all scheduled posts
  2. Check if scheduledFor <= now
  3. For due posts:
     - Update status to 'publishing'
     - Get feed credentials from localStorage
     - Call POST /api/instagram/publish
     - On success: status = 'published'
     - On error: status = 'failed' (show error)
```

## Testing Checklist

- [ ] Create post with future date/time
- [ ] Post appears in Queue tab
- [ ] Post appears on Calendar
- [ ] Can delete scheduled posts
- [ ] Media type selector works
- [ ] Media URL field shows for VIDEO/REELS only
- [ ] Can't schedule past dates (validation)
- [ ] Auto-publish works (schedule 1 min in future, wait)
- [ ] Status updates in real-time
- [ ] Error message shows if publish fails

## Console Logs

Watch browser console (F12) for:
- `📅 Added scheduled post` - Created
- `▶️ Starting scheduler polling` - Polling started
- `📤 Publishing scheduled post` - Publishing
- `✅ Post published successfully` - Success!
- `🗑️ Removed scheduled post` - Deleted

## Troubleshooting

**Posts don't publish:**
- Check browser console for errors
- Verify feed has accessToken in localStorage
- Check if scheduled time is actually in the past
- Polling is every 30 seconds (takes up to 60s)

**Posts not saving:**
- Check localStorage is enabled
- Browser privacy mode blocks localStorage
- Clear cache and try again

**Instagram publish fails:**
- Check access_token is valid
- Check instagram_user_id is correct
- Media URL must be publicly accessible
- Account needs content_publish permission

## Files That Changed

**NEW:**
- `app/cockpit/my-e-assets/my-feeds/lib/scheduler-store.ts`

**UPDATED:**
- `app/cockpit/my-e-assets/my-feeds/components/scheduler/SchedulerModal.tsx`

**UNCHANGED (kept for future Prisma integration):**
- `app/api/scheduler/route.ts`
- `app/api/instagram/publish/route.ts`

## Next Steps

When Prisma/PostgreSQL is set up:
1. Keep scheduler-store.ts (useful as fallback)
2. Update SchedulerModal to try API first
3. Fall back to localStorage if no API
4. Migrate data to database

## Performance Notes

- localStorage reads/writes are instant
- Polling runs every 30 seconds (non-blocking)
- O(n) complexity per poll (scans all posts)
- Works fine for 100+ posts
- Consider IndexedDB if storage > 5MB
