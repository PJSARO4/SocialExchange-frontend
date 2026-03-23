# Instagram OAuth Deployment Checklist

**Goal**: Deploy the new Instagram OAuth system to production

**Time Estimate**: 30 minutes (+ 2-7 days for Meta app review)

---

## Pre-Deployment (Local Testing)

### Code Review
- [ ] Read all new API routes
- [ ] Review MyFeedsContent.tsx changes
- [ ] Check Prisma schema changes
- [ ] Verify no credentials in code

### Local Testing
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to http://localhost:3000
- [ ] Go to My Feeds → Add Account
- [ ] Test OAuth flow (if tunnel is set up)
- [ ] Verify no console errors

### Build Check
- [ ] Run `npm run build` (check for TypeScript errors)
- [ ] Verify build succeeds without warnings

---

## Deployment to Production (Vercel)

### Step 1: Commit Changes

```bash
cd "/path/to/SocialExchangeFrontEnd 2"

# Stage all new files
git add \
  prisma/schema.prisma \
  app/api/instagram/accounts/ \
  app/api/instagram/analytics/ \
  app/api/instagram/comments/ \
  app/cockpit/my-e-assets/my-feeds/MyFeedsContent.tsx \
  lib/instagram-account-storage.ts \
  docs/ \
  OAUTH-IMPLEMENTATION-SUMMARY.md \
  DEPLOYMENT-CHECKLIST.md

# Commit with co-author
git commit -m "feat: Complete Instagram OAuth system with database token storage

- Add InstagramAccount Prisma model for persistent token storage
- Create 6 new API routes for OAuth token management
- Add analytics, comments, and refresh endpoints
- Enhance OAuth callback handler to save tokens to database
- Support multiple Instagram accounts per user
- Add automatic token refresh before 60-day expiry
- Include comprehensive Meta app review guide
- Include technical implementation documentation

Enables:
- Production-ready multi-account OAuth
- Database-backed token persistence (no localStorage)
- Automatic token refresh via Vercel cron
- Real-time analytics and insights fetching
- Comment reading and replying
- Secure token storage and lifecycle management

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

# Push to origin
git push origin main
```

### Step 2: Database Migration (via Vercel)

Once code is deployed:

1. Go to Vercel Dashboard
2. Select the "social-exchange-frontend" project
3. Wait for automatic deployment to complete
4. Verify no build errors in Vercel logs

Once deployment is successful, run migration:

```bash
# Option 1: Via Vercel CLI (if installed)
vercel env pull .env.production.local
npx prisma db push --skip-generate

# Option 2: Via Vercel CLI interactive
vercel ssh
# Then run on the instance:
npx prisma db push --skip-generate
```

### Step 3: Set Environment Variables

Ensure these are set in Vercel (Settings → Environment Variables):

```
✅ DATABASE_URL        (Neon PostgreSQL URL)
✅ DIRECT_URL          (Neon Direct URL)
✅ NEXTAUTH_URL        (https://yourdomain.com)
✅ NEXTAUTH_SECRET     (32-char random string)
✅ META_CLIENT_ID      (1414826430175896)
✅ META_CLIENT_SECRET  (aee8da886043231c...)
✅ INSTAGRAM_CLIENT_ID (1415083063497892)
✅ INSTAGRAM_CLIENT_SECRET (650052ae0b2239f...)
✅ CRON_SECRET         (32-char random string - for token refresh)
```

### Step 4: Enable Vercel Cron (Optional But Recommended)

Create/update `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/instagram/accounts/refresh-token?cron=1&secret=YOUR_CRON_SECRET",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Then commit and push:

```bash
git add vercel.json
git commit -m "chore: Add Vercel cron for Instagram token refresh"
git push origin main
```

---

## Post-Deployment Verification

### Test OAuth Flow on Production

1. Navigate to https://yourdomain.com
2. Log in with test credentials
3. Go to My Feeds → Add Account → Instagram → OAuth
4. Complete the OAuth flow
5. Verify:
   - [ ] Account connects successfully
   - [ ] Real Instagram data displays
   - [ ] Followers, posts, bio are correct
   - [ ] Token is saved (refresh page, data persists)

### Verify API Endpoints

```bash
# Test with your production domain and a real access token

# 1. Fetch profile
curl https://yourdomain.com/api/instagram/profile?access_token=YOUR_TOKEN

# 2. List connected accounts
curl -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  https://yourdomain.com/api/instagram/accounts/connect

# 3. Fetch analytics
curl -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  https://yourdomain.com/api/instagram/analytics?accessToken=YOUR_TOKEN
```

### Check Vercel Logs

1. Go to Vercel Dashboard
2. Select project → Deployments
3. Click latest deployment
4. Check Logs for any errors
5. Search for "[Instagram]" to see OAuth operations

### Monitor Database

1. Go to Neon Dashboard
2. Check for new `instagramaccount` table
3. Query to verify data is being saved:
   ```sql
   SELECT id, handle, instagramUserId, isConnected FROM "InstagramAccount" LIMIT 5;
   ```

---

## Prepare for Meta App Review

### Step 1: Update Privacy Policy

Add to your privacy policy (https://yourdomain.com/privacy):

```markdown
## Instagram Data & Privacy

Social Exchange connects to Instagram Business and Creator accounts
to provide content management and analytics features.

### What Data We Access

When you authorize Social Exchange to access your Instagram account,
we request permission to:

1. **Profile Information** (instagram_business_basic)
   - Account username and display name
   - Follower and following counts
   - Biography and profile picture
   - Account type (Business/Creator)

2. **Publishing Capability** (instagram_business_content_publish)
   - Create and publish posts (images, videos, carousels)
   - Schedule posts for future publishing
   - This allows you to use Social Exchange to post to Instagram

3. **Insights & Analytics** (instagram_business_manage_insights)
   - Engagement metrics (likes, comments, shares)
   - Reach and impressions
   - Audience demographics and insights
   - This data helps us display your Instagram analytics dashboard

### How We Use Your Data

- All data is used solely to provide Social Exchange services
- Your data is never sold, shared, or used for advertising
- You can revoke access at any time by disconnecting your account
- We do not store posts or media on our servers

### Revoking Access

You can disconnect your Instagram account from Social Exchange at any time:
1. Go to Social Exchange → My Feeds → Settings
2. Click "Disconnect Account"
3. Confirm the disconnection

This immediately revokes our access to your Instagram account.

### Data Retention

- Access tokens are deleted when you disconnect
- Cached metrics are deleted after 30 days of account disconnection
- We retain no content you've posted

### Questions?

For privacy questions, contact: privacy@yourdomain.com
```

### Step 2: Review Test Accounts

Ensure test accounts are ready:

- [ ] @testcreator_basic exists
- [ ] @testcreator_advanced exists
- [ ] Both have profile pictures
- [ ] Both have bios (2+ sentences)
- [ ] Both have 1-2 posts
- [ ] Both are added to Meta app as testers

### Step 3: Prepare Submission Materials

Gather these files in a folder:

```
Meta App Review Submission/
├── SCREENCAST.mp4 (2-5 minute demo)
├── TEST_ACCOUNTS.txt (credentials for reviewers)
├── SUBMISSION_NOTES.md (answers to review form questions)
└── PRIVACY_POLICY_EXCERPT.md (relevant policy sections)
```

**Privacy Policy Link**: https://yourdomain.com/privacy

**Test Account Credentials**:
```
Account 1: @testcreator_basic
Password: TestPassword123!

Account 2: @testcreator_advanced
Password: TestPassword456!
```

**Submission Notes** (answers to Meta form):

```markdown
## How will your app use instagram_business_basic?

Social Exchange is a content management platform for Instagram creators.
We read basic profile information to display account statistics and help
creators manage multiple Instagram accounts. Users explicitly authorize
this access via OAuth, and we only access public profile data.

## How will your app use instagram_business_content_publish?

Social Exchange allows creators to schedule and publish Instagram posts
directly from our platform. This permission enables creating and publishing
images, videos, and carousel posts. Users explicitly control all content
published and can schedule posts in advance.

## How will your app use instagram_business_manage_insights?

Social Exchange provides creators with analytics dashboards. This permission
allows us to fetch engagement metrics, reach, impressions, and audience
insights. Data is only accessible to the account owner who authorized it.
We do not share or sell this data.
```

### Step 4: Record Screencast

Use OBS Studio (free):

```bash
# 1. Download OBS Studio
brew install obs  # macOS
# or download from https://obsproject.com

# 2. Configure recording
# - Scene: Add display capture
# - Audio: Capture system audio or microphone
# - Format: MP4
# - Resolution: 1280x720 (720p)

# 3. Start recording
# - Open Social Exchange login
# - Click "Demo Login" or enter credentials
# - Navigate to My Feeds
# - Click "Add Account" → Instagram → OAuth
# - Complete Instagram login
# - Show account connecting with real data
# - Show analytics tab
# - Stop recording (~3-4 minutes)

# 4. Export
# File → Export → Export Video
# Choose MP4 format, save to "SCREENCAST.mp4"
```

**Screencast Checklist**:
- [ ] 2-5 minutes duration
- [ ] 720p or higher resolution
- [ ] Clear audio narration
- [ ] Shows complete OAuth flow
- [ ] Shows real Instagram data loading
- [ ] Shows analytics/insights
- [ ] Saved as MP4 or MOV

### Step 5: Submit for Review

1. Go to Meta Developer Console
2. Select Social Exchange app
3. Go to App Review → Submit App for Review
4. For each permission (instagram_business_basic, instagram_business_content_publish, instagram_business_manage_insights):
   - Click "Get Started"
   - Fill in the required fields with text from "SUBMISSION_NOTES.md"
   - Upload screencast
   - Provide test account credentials
5. Click "Submit for Review"

**Expected Timeline**: 2-7 days for review

---

## Post-Review Actions

### If Approved ✅

1. Switch to Live Mode in Meta app settings
2. Test with production Instagram accounts
3. Update app documentation
4. Monitor logs for errors
5. Announce feature to users

### If Rejected ❌

1. Read Meta's rejection reasons carefully
2. Make requested changes
3. Resubmit for review
4. No penalty for rejections - multiple submissions are normal

---

## Monitoring Post-Deployment

### Daily
- [ ] Check Vercel logs for errors
- [ ] Monitor API response times
- [ ] Check for failed authentications

### Weekly
- [ ] Review token refresh success rate
- [ ] Check for any connection errors
- [ ] Monitor database query performance

### Monthly
- [ ] Test OAuth flow with fresh account
- [ ] Review Instagram API rate limits
- [ ] Check for deprecations in Instagram API

---

## Rollback Plan

If critical issues arise after deployment:

```bash
# Revert the deployment
git revert HEAD
git push origin main
# Vercel will automatically redeploy the previous version

# Then investigate the issue and fix
# Redeploy when ready
```

---

## Quick Reference

### Useful Commands

```bash
# Check build locally
npm run build

# Test development server
npm run dev

# Commit and push
git add .
git commit -m "message"
git push origin main

# Check Prisma schema
npx prisma validate

# View database
npx prisma studio  # Opens UI at http://localhost:5555
```

### Key Endpoints (After Deployment)

```
GET    /api/instagram/accounts/connect
POST   /api/instagram/accounts/connect
POST   /api/instagram/accounts/disconnect
POST   /api/instagram/accounts/refresh-token
GET    /api/instagram/analytics
GET    /api/instagram/comments
POST   /api/instagram/comments
```

### Emergency Contacts

- Vercel Status: https://www.vercel-status.com/
- Instagram API Issues: https://developers.facebook.com/status/
- Database Issues: Neon Dashboard

---

## Sign-Off Checklist

- [ ] Code reviewed and tested locally
- [ ] All new files added to git
- [ ] Commit message is descriptive
- [ ] Pushed to origin/main
- [ ] Vercel deployment successful
- [ ] No build errors in Vercel logs
- [ ] Prisma migration ran successfully
- [ ] OAuth flow tested in production
- [ ] Database has data in instagramaccount table
- [ ] Privacy policy updated
- [ ] Test accounts are ready
- [ ] Screencast recorded and tested
- [ ] Ready to submit for Meta app review

---

**Deployment Status**: Ready to proceed
**Next Step**: Commit changes and push to main
**Timeline**: 30 min deployment + 2-7 days Meta review
