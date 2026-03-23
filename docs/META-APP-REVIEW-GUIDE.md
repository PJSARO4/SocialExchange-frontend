# Meta App Review Guide: Moving Social Exchange to Live Mode

This guide walks you through transitioning the Social Exchange Instagram OAuth integration from Development Mode to Live Mode on the Meta Developer platform.

---

## Table of Contents

1. [Current Status](#current-status)
2. [Prerequisites](#prerequisites)
3. [Required Permissions & Justification](#required-permissions--justification)
4. [Step-by-Step App Review Process](#step-by-step-app-review-process)
5. [Test Instructions for Meta Reviewers](#test-instructions-for-meta-reviewers)
6. [Screencast Recording Guide](#screencast-recording-guide)
7. [Common Rejection Reasons & How to Avoid Them](#common-rejection-reasons--how-to-avoid-them)
8. [Post-Approval Setup](#post-approval-setup)

---

## Current Status

**Application Name**: Social Exchange
**Meta App ID**: 1414826430175896
**Instagram App ID**: 1415083063497892
**Current Mode**: Development (test users only)
**Framework**: Next.js 15 + NextAuth.js + Prisma
**OAuth Flow**: Instagram Business Account OAuth via `instagram-direct` provider

**Currently Connected Test Accounts**:
- @gigglelizards (ID: 25553454887687595)
- @literallypie (ID: 25882794091381764)

---

## Prerequisites

Before submitting for review, ensure the following are complete:

### 1. **Production Deployment** ✓
- [ ] App is deployed to production (e.g., Vercel)
- [ ] Database is configured (Neon PostgreSQL with `DATABASE_URL` and `DIRECT_URL`)
- [ ] Environment variables are set in production:
  - `META_CLIENT_ID`
  - `META_CLIENT_SECRET`
  - `INSTAGRAM_CLIENT_ID`
  - `INSTAGRAM_CLIENT_SECRET`
  - `NEXTAUTH_URL` (production URL)
  - `NEXTAUTH_SECRET`

### 2. **Privacy & Terms**
- [ ] Privacy Policy is published and accessible at `https://yourdomain.com/privacy`
- [ ] Terms of Service are published at `https://yourdomain.com/terms`
- [ ] Both documents clearly disclose:
  - What Instagram data is collected
  - How it's used
  - How users can request deletion
  - Contact information for privacy inquiries

### 3. **Security Checklist**
- [ ] HTTPS is enforced on all endpoints
- [ ] Instagram tokens are encrypted in the database (use Prisma field encryption)
- [ ] Access tokens are never logged to console in production
- [ ] Token refresh is automated before expiry (60-day Instagram tokens)
- [ ] CSRF protection is enabled (NextAuth handles this)
- [ ] Rate limiting is implemented on API endpoints

### 4. **Platform Compliance**
- [ ] App fully complies with Meta Platform Policies
- [ ] App fully complies with Instagram Brand Guidelines
- [ ] No misleading content in app description
- [ ] App does not violate any Instagram API policies

---

## Required Permissions & Justification

When submitting for review, you'll need to request the following Instagram permissions:

### 1. **instagram_business_basic** (Already in Development)
**Purpose**: Read basic profile information
**Data Accessed**:
- User ID
- Username
- Account type
- Followers count
- Following count
- Media count
- Profile picture URL
- Biography

**Justification**:
_"Social Exchange is a content management platform for Instagram creators. We read basic profile information to display account statistics and help creators manage multiple Instagram accounts. Users explicitly authorize this access via OAuth, and we only access public profile data."_

### 2. **instagram_business_content_publish** (Already in Development)
**Purpose**: Create and publish Instagram posts (images, videos, carousels, reels)
**Data Accessed**:
- Ability to create media containers
- Ability to publish posts to user's feed

**Justification**:
_"Social Exchange allows creators to schedule and publish content to Instagram directly from our platform. This permission is required to create and publish images, videos, and carousel posts to user Instagram feeds. Users explicitly authorize this access and control all content published through our platform."_

### 3. **instagram_business_manage_insights** (Already in Development)
**Purpose**: Fetch analytics and engagement metrics
**Data Accessed**:
- Impressions
- Reach
- Profile views
- Follower growth
- Website clicks
- Email/phone contact clicks
- Comment counts
- Like counts

**Justification**:
_"Social Exchange provides creators with analytics dashboards showing engagement metrics, audience growth, and post performance. This permission allows us to fetch these insights to display to the creator in real-time. Data is only accessible to the account owner who authorized it."_

---

## Step-by-Step App Review Process

### Step 1: Access the Meta Developer Dashboard

1. Go to [Meta Developers](https://developers.facebook.com)
2. Log in with your Meta developer account
3. Select the "Social Exchange" app from your apps list
4. Go to **Settings → Basic** to see your App ID and App Secret

### Step 2: Navigate to App Roles

1. In the left sidebar, click **Roles** under Settings
2. Make sure your developer account is set as **Admin**
3. (Optional) Add team members as Developers or Testers

### Step 3: Request Permissions for Review

1. Go to **Settings → App Review**
2. Under "Permissions and Features", you should see:
   - `instagram_business_basic`
   - `instagram_business_content_publish`
   - `instagram_business_manage_insights`

3. If permissions are not visible, add them:
   - Click **Add a Permission or Feature**
   - Search for each permission above
   - Click to request

### Step 4: Complete the Submission Form

For each permission, Meta will ask you to complete a form with:

#### **instagram_business_basic**
- **App Purpose**: Selecting public content data

**Form Fields**:
- "How will your app use this permission?"
  _Answer_: "Our application, Social Exchange, is a content management suite for Instagram creators. We use this permission to display account statistics such as follower count, media count, and account type. This helps creators monitor their account health across multiple profiles."

- "Will users be able to revoke access?"
  _Answer_: "Yes. Users can disconnect any Instagram account from Social Exchange at any time, which immediately revokes our access."

- "Will this data be sold?"
  _Answer_: "No, data is never sold."

- "Will this data be used for ads or political purposes?"
  _Answer_: "No."

#### **instagram_business_content_publish**
- **App Purpose**: Publishing content

**Form Fields**:
- "Describe the experience your app provides to users."
  _Answer_: "Social Exchange allows creators to schedule Instagram posts in advance and publish them with a single click. Users can upload images, write captions, add hashtags, and choose a publish time. Our system automatically publishes at the scheduled time using this permission."

- "How does publishing work in your app?"
  _Answer_: "Users draft posts in our content editor, set a publish date/time, and either publish immediately or schedule for later. For scheduled posts, our backend system publishes the post at the specified time using the user's access token."

- "Will published content violate Instagram Community Guidelines?"
  _Answer_: "No. Social Exchange enforces Instagram's Community Guidelines and does not allow publishing of prohibited content. We do not auto-generate or inject content."

- "Can users edit/delete posts after publishing?"
  _Answer_: "Yes. Users can edit or delete any posts published through Social Exchange, and these changes are reflected in their Instagram feed."

- "Will you use this permission for ads or spam?"
  _Answer_: "No. This permission is solely for users to publish their own content to their own accounts."

#### **instagram_business_manage_insights**
- **App Purpose**: Reading insights

**Form Fields**:
- "How will your app use this permission?"
  _Answer_: "Social Exchange provides creators with analytics dashboards showing engagement metrics, audience growth, and post performance. We fetch these insights in real-time to show creators detailed analytics about their audience and content."

- "Will insights data be shared with third parties?"
  _Answer_: "No. Insights data is only accessible to the account owner who authorized it."

- "Will data be used for ads or targeting?"
  _Answer_: "No. Analytics are only for the creator's own use."

### Step 5: Provide Test Account Access

1. Go to **Roles → Test Users**
2. Make sure you have at least 2 test Instagram Business accounts set up
3. These accounts should have profiles with:
   - Profile picture
   - Bio
   - At least 1-2 posts
   - Followers/following

**Example Test Accounts**:
- Account 1: @testcreator_basic (Business Account)
- Account 2: @testcreator_advanced (Creator Account)

### Step 6: Submit for Review

1. Go to **App Review**
2. Click **Submit App for Review**
3. For each permission, select **Get Started**
4. Complete all required fields (see Step 4 above)
5. Submit a link to your screencast (see below)
6. Click **Submit for Review**

---

## Test Instructions for Meta Reviewers

Include the following test instructions in your submission:

---

### **Test Account Credentials**

**Test Account 1: Business Account**
- Username: `@testcreator_basic`
- Password: `TestPassword123!`
- Account Type: BUSINESS

**Test Account 2: Creator Account**
- Username: `@testcreator_advanced`
- Password: `TestPassword456!`
- Account Type: CREATOR

---

### **Test Flow Instructions**

**1. Login & OAuth Flow**
```
1. Navigate to https://social-exchange.vercel.app
2. Click "Demo Login" or enter credentials
3. Go to "My Feeds" section
4. Click "Add Account" → Select Instagram → Choose "OAuth"
5. You will be redirected to Instagram login
6. Log in with test account: @testcreator_basic
7. Review the requested permissions popup
8. Click "Allow" to authorize
9. You will be redirected back to Social Exchange
10. Verify the account is now showing real Instagram data (followers, bio, posts)
```

**2. View Profile Data (instagram_business_basic)**
```
1. After OAuth, click the account card to select it
2. Go to "Analytics" tab
3. Verify the following real data is displayed:
   - Follower count
   - Following count
   - Total posts
   - Account type (BUSINESS/CREATOR)
   - Profile picture
   - Bio
```

**3. Publish a Post (instagram_business_content_publish)**
```
1. Select the test account
2. Click "Create Post" in Quick Actions
3. Enter a test caption: "Testing Social Exchange content publishing"
4. Click "Publish Now" (or schedule for 1 minute from now)
5. Monitor the browser console (press F12) for status messages
6. Wait 30-60 seconds for the post to publish
7. Check the test Instagram account to verify the post appears in the feed
8. The post should be visible with the caption we provided
9. Return to Social Exchange and verify the post status shows "PUBLISHED"
```

**4. Fetch Insights (instagram_business_manage_insights)**
```
1. Go to Analytics tab (if already published a post or have existing posts)
2. Refresh the page
3. Verify the following metrics load:
   - Impressions (last 90 days)
   - Reach
   - Profile views
   - Engagement rate
   - Website clicks (if bio has a link)
4. These should be real data from Instagram Insights API, not mock data
```

**5. View Recent Comments (instagram_business_manage_insights)**
```
1. Go to the "Comments" section
2. Recent comments on the account's posts should appear
3. Verify each comment shows:
   - Commenter username
   - Comment text
   - Timestamp
4. These should be real data from the Instagram Graph API
```

**6. Test Token Persistence (Database Storage)**
```
1. After successful OAuth, close the browser completely
2. Open the app again and log back in
3. Navigate to My Feeds
4. Verify the account is still connected with all data intact
5. This confirms tokens are stored in database, not just localStorage
```

**7. Revoke Access & Reconnect**
```
1. Click the test account
2. Click Settings → Disconnect Account
3. Confirm the account is removed
4. Click "Add Account" again and reconnect via OAuth
5. Verify everything works smoothly on reconnection
```

---

## Screencast Recording Guide

Meta requires a screencast showing the OAuth flow and basic functionality.

### **Screencast Requirements**

- **Duration**: 2-5 minutes
- **Format**: MP4, MOV, or WebM
- **Resolution**: 720p minimum
- **Audio**: Clear narration explaining each step
- **Include**:
  1. Starting from the app login page
  2. Navigating to "My Feeds"
  3. Adding a new Instagram account via OAuth
  4. Completing the Instagram authorization
  5. Seeing real profile data populate
  6. Publishing a test post
  7. Verifying the post appears on Instagram

### **Recording Steps (using OBS Studio - free)**

1. **Download OBS Studio** from [obsproject.com](https://obsproject.com)

2. **Configure OBS**:
   - Scene: Default
   - Add a Display Capture or Window Capture
   - Select your browser window
   - Configure audio to capture system audio or microphone

3. **Start Recording**:
   ```
   1. Open Social Exchange in your browser
   2. Click Record in OBS
   3. Navigate through the OAuth flow
   4. Publish a test post
   5. Show the post on the real Instagram profile
   6. Stop recording
   ```

4. **Save & Upload**:
   - OBS saves to your default video folder
   - Upload to an accessible URL (Google Drive, Dropbox, YouTube unlisted)
   - Include the link in your Meta app review submission

### **Screencast Script Example**

```
"Welcome to Social Exchange. This is a content management platform for Instagram creators.

First, let me log in to the app. [Login with demo account]

Now I'll navigate to My Feeds where we manage Instagram accounts.

I'll click 'Add Account' and select Instagram OAuth.

This takes me to Instagram's OAuth login. I'll authorize the required permissions:
basic profile access, content publishing, and insights.

After authorization, I'm redirected back to Social Exchange. Notice the account
is now fully connected and displaying real Instagram data including followers,
biography, and recent post performance.

Now let me demonstrate publishing a post. I'll click Create Post, enter a test
caption, and publish immediately.

The post has been published successfully. Let me check the real Instagram account
to verify. Here it is on the actual Instagram profile, confirming the publish
permission works correctly.

Finally, let me show the analytics working. These real-time metrics come from
Instagram Insights API, showing impressions, reach, engagement, and more.

That completes the demo. Social Exchange fully integrates Instagram OAuth with
all three required permissions: profile access, content publishing, and analytics."
```

---

## Common Rejection Reasons & How to Avoid Them

### ❌ Rejection Reason #1: "Privacy Policy Missing or Inadequate"

**Why it happens**: Policy doesn't disclose Instagram data collection or usage.

**How to Fix**:
- Add a dedicated section: **"Instagram Data & Privacy"**
- Clearly state:
  ```
  "Social Exchange accesses the following Instagram data when you authorize:
  - Profile information (name, username, followers, bio, profile picture)
  - Content metrics (engagement, reach, impressions)
  - Ability to publish posts on your behalf

  You can revoke access at any time. We do not sell, share, or use this data
  for advertising or any purpose other than providing the Social Exchange service."
  ```
- Include a data deletion request process
- Add contact info for privacy inquiries

### ❌ Rejection Reason #2: "No Clear Opt-Out/Disconnect Mechanism"

**Why it happens**: Users can't easily disconnect their Instagram account.

**How to Fix**:
- Ensure Settings page has clear "Disconnect Account" button
- Clicking should:
  1. Remove the token from database
  2. Show success message
  3. Require re-authorization if user wants to reconnect
- Test before submitting

### ❌ Rejection Reason #3: "Unclear Use Case or Auto-Publishing"

**Why it happens**: Meta thinks the app auto-generates content or publishes without user approval.

**How to Fix**:
- In your submission, be explicit:
  ```
  "Social Exchange does NOT auto-generate content. Every post published through
  our platform is created by the user with explicit intent. The user writes the
  caption, selects the image, and either publishes immediately or schedules a
  specific date/time. We never auto-post or inject content."
  ```
- Your screencast must show user explicitly confirming publish

### ❌ Rejection Reason #4: "Using Insights for Ads or Analytics Sharing"

**Why it happens**: App description implies selling analytics data or using it for advertising.

**How to Fix**:
- Clarify that insights are **only for the creator's own use**
- Never mention: "export analytics to 3rd party", "share with marketers", "sell analytics"
- Your privacy policy must state: "Analytics data is never shared with third parties"

### ❌ Rejection Reason #5: "Tokens Not Securely Stored"

**Why it happens**: Token storage isn't encrypted or is visible in client-side code.

**How to Fix**:
- Store tokens in **database (Prisma)**, not localStorage
- Use environment variable encryption in production
- Never log tokens to console
- Use HTTPS only
- Implement token expiry and automatic refresh

### ❌ Rejection Reason #6: "App Crashes or Test Flow Fails"

**Why it happens**: OAuth callback broken, API endpoints fail, or posts don't publish.

**How to Fix**:
- Test the full flow 5-10 times before submitting
- Ensure test accounts have:
  - Profile pictures
  - Bios
  - At least 1-2 existing posts
- Monitor browser console for errors
- Check Vercel/server logs for API failures
- Test with both test accounts provided

### ❌ Rejection Reason #7: "Credentials or API Keys in Submission"

**Why it happens**: Reviewer can see app secrets in code or console logs.

**How to Fix**:
- Never include credentials in screenshots
- Never log `access_token` values to console in production
- Use environment variables for all secrets
- Review your code for any hardcoded secrets before submitting

---

## Post-Approval Setup

Once Meta approves your app, follow these steps:

### 1. **Move to Live Mode**

1. Go to **Settings → Basic**
2. Click the toggle next to **"Development Mode"** to switch to **"Live Mode"**
3. Confirm the switch (this is irreversible without contacting Meta)

### 2. **Test with Production Accounts**

1. Create a few production Instagram Business/Creator accounts
2. Test the full OAuth flow with these accounts
3. Verify publishing, analytics, and all features work
4. Monitor server logs for errors

### 3. **Enable Database Persistence**

If you haven't already:

```bash
# 1. Ensure DATABASE_URL and DIRECT_URL are set in production
# 2. Run migrations on Vercel
npx prisma db push

# 3. Update your OAuth handler to use the new InstagramAccount model
# (See lib/prisma-instagram-storage.ts for implementation)

# 4. Test token persistence across browser sessions
```

### 4. **Set Up Token Refresh Cron Job**

Configure Vercel Cron to refresh expiring tokens:

```bash
# 1. Add to vercel.json:
{
  "crons": [{
    "path": "/api/instagram/accounts/refresh-token?secret=YOUR_CRON_SECRET",
    "schedule": "0 0 * * *"  // Daily at midnight UTC
  }]
}

# 2. Add CRON_SECRET to Vercel environment variables
```

### 5. **Monitor & Maintain**

- Monitor error logs weekly for API failures
- Check token refresh success rates
- Monitor rate limits on Instagram API
- Set up alerts for broken OAuth flows

---

## Troubleshooting

### Issue: "Invalid redirect_uri"
**Solution**: Ensure `NEXTAUTH_URL` matches exactly what's in Meta app settings. Include trailing slash if needed.

### Issue: "Permission denied" when fetching profile
**Solution**: Test account may not be authorized. Re-run OAuth with correct account and accept all permissions.

### Issue: "Post fails to publish"
**Solution**:
- Check token hasn't expired
- Verify test account is BUSINESS or CREATOR type
- Check Instagram API rate limits
- Review publish API response for specific error

### Issue: "Meta says access_token is invalid"
**Solution**:
- May be using a Facebook token instead of Instagram token
- Instagram OAuth should return `user_id`, not Facebook ID
- Check your OAuth provider configuration

---

## FAQ

**Q: Can I test in Development Mode indefinitely?**
A: Yes, but only with designated test accounts. For production use, you must move to Live Mode.

**Q: How long does app review take?**
A: 2-7 days typically. Complex apps may take longer. Meta provides updates via email.

**Q: Can I revert from Live Mode to Development?**
A: Contact Meta support to request this. It's uncommon but possible.

**Q: What if my app gets rejected?**
A: Meta will email specific reasons. Fix the issues and resubmit. Rejects usually don't count against you.

**Q: Can I publish different features in different waves?**
A: Yes. You can request permissions in phases: start with `instagram_business_basic` alone, then add publishing and insights later.

---

## Key Contacts

- **Meta Developer Support**: [developers.facebook.com/support](https://developers.facebook.com/support)
- **Instagram Graph API Docs**: [developers.facebook.com/docs/instagram-api](https://developers.facebook.com/docs/instagram-api)
- **App Review Policies**: [developers.facebook.com/docs/apps/review](https://developers.facebook.com/docs/apps/review)

---

**Last Updated**: March 2026
**Next Review Recommended**: After adding more features or significant changes
