# Instagram OAuth Implementation Guide

Complete technical documentation for the Social Exchange Instagram OAuth system.

---

## Quick Overview

Social Exchange integrates Instagram OAuth to allow creators to:
- Connect multiple Instagram accounts (Business/Creator)
- Publish posts directly from the platform
- View real-time analytics and engagement metrics
- Read and respond to comments

**Current Status**: OAuth working with localStorage token storage. Database integration ready for production.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Social Exchange Frontend                   │
│  (Next.js 15, React 18, NextAuth.js)                         │
└──────────────────────────────────────────────────────────────┘
            │
            │ OAuth Flow
            ↓
┌──────────────────────────────────────────────────────────────┐
│              NextAuth Instagram Provider                      │
│  /api/auth/[...nextauth]/route.ts                             │
│  - Handles OAuth callback from Instagram                      │
│  - Exchanges code for access token                            │
│  - Stores token in NextAuth Account model                     │
└──────────────────────────────────────────────────────────────┘
            │
            │ Redirect with query param
            ↓
┌──────────────────────────────────────────────────────────────┐
│           MyFeedsContent.tsx (OAuth Callback Handler)         │
│  - Detects "?connected=instagram" query param                 │
│  - Calls /api/instagram/profile to fetch real data            │
│  - Calls /api/instagram/accounts/connect to save to DB        │
│  - Updates FeedsContext with new account                      │
└──────────────────────────────────────────────────────────────┘
            │
            │ Save Token
            ↓
┌──────────────────────────────────────────────────────────────┐
│              Database (Neon PostgreSQL)                       │
│  - InstagramAccount table (via Prisma)                        │
│  - Stores encrypted access tokens                             │
│  - Tracks token expiry & refresh tokens                       │
│  - Caches metrics (followers, engagement, etc)                │
└──────────────────────────────────────────────────────────────┘
            │
            │ Use Stored Token
            ↓
┌──────────────────────────────────────────────────────────────┐
│            Instagram Graph API Endpoints                      │
│  /api/instagram/profile        - Profile & basic info         │
│  /api/instagram/analytics      - Insights & metrics           │
│  /api/instagram/publish        - Create & publish posts       │
│  /api/instagram/comments       - Fetch & reply to comments    │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Schema

The `InstagramAccount` model stores OAuth connections:

```prisma
model InstagramAccount {
  id                      String    @id @default(cuid())
  userId                  String
  user                    User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Instagram identifiers
  instagramUserId         String    // The actual Instagram user ID from OAuth
  handle                  String    // @username
  displayName             String?
  accountType             String?   // BUSINESS, CREATOR, PERSONAL
  profilePictureUrl       String?
  biography               String?

  // OAuth tokens (encrypted in production)
  accessToken             String    @db.Text
  accessTokenExpires      DateTime?
  refreshToken            String?   @db.Text
  refreshTokenExpires     DateTime?

  // Token metadata
  scopes                  String[]  // Permissions granted
  tokenType               String    @default("bearer")

  // Connection state
  isConnected             Boolean   @default(true)
  lastSyncAt              DateTime?
  lastTokenRefreshAt      DateTime?
  lastTokenRefreshError   String?

  // Cached metrics (synced periodically)
  cachedFollowers         Int       @default(0)
  cachedFollowing         Int       @default(0)
  cachedMediaCount        Int       @default(0)
  cachedEngagementRate    Float     @default(0)
  lastMetricsSyncAt       DateTime?

  // Account flags
  isPrimary               Boolean   @default(false)  // Main account for user
  isTestAccount           Boolean   @default(false)  // Meta test account
  autoRefreshEnabled      Boolean   @default(true)

  // Metadata
  metadata                Json?     // Platform-specific data
  connectionError         String?   // Last error if connection fails

  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  @@unique([userId, instagramUserId])
  @@index([userId])
  @@index([handle])
  @@index([instagramUserId])
}
```

---

## OAuth Flow Steps

### 1. User Initiates Connection

User navigates to My Feeds → Add Account → Instagram → OAuth

```typescript
// app/cockpit/my-e-assets/my-feeds/components/AddFeedModal.tsx
const handleOAuthConnect = async (platform: 'instagram') => {
  // Redirect to NextAuth signin
  await signIn('instagram-direct', {
    // redirect callback will include query param
    redirect: true,
    callbackUrl: '/cockpit/my-e-assets/my-feeds?connected=instagram',
  });
};
```

### 2. Instagram OAuth Authorization

NextAuth redirects to Instagram OAuth endpoint:

```
GET https://www.instagram.com/oauth/authorize
?client_id={INSTAGRAM_CLIENT_ID}
&scope=instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights
&response_type=code
&redirect_uri={NEXTAUTH_URL}/api/auth/callback/instagram-direct
```

User logs in with Instagram credentials and authorizes the app.

### 3. OAuth Callback

Instagram redirects back to your app with authorization code:

```
GET {NEXTAUTH_URL}/api/auth/callback/instagram-direct?code=...&state=...
```

NextAuth exchanges the code for an access token:

```typescript
// lib/auth.ts - InstagramDirectProvider
const InstagramDirectProvider = {
  // ...
  token: {
    async request({ params, provider }) {
      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: provider.clientId,
          client_secret: provider.clientSecret,
          grant_type: 'authorization_code',
          code: params.code,
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/instagram-direct`,
        }),
      });
      const tokens = await response.json();
      return { tokens };
    },
  },
};
```

### 4. Frontend OAuth Callback Handler

MyFeedsContent.tsx detects the redirect and saves the token:

```typescript
// app/cockpit/my-e-assets/my-feeds/MyFeedsContent.tsx
useEffect(() => {
  const connectedPlatform = searchParams?.get('connected') as Platform | null;
  if (connectedPlatform && session?.user && !oauthProcessed) {
    // Fetch real profile data
    const profileData = await fetch(
      `/api/instagram/profile?access_token=${user.accessToken}`
    ).then(r => r.json());

    // Save token to database
    await fetch('/api/instagram/accounts/connect', {
      method: 'POST',
      body: JSON.stringify({
        instagramUserId: profileData.id,
        handle: `@${profileData.username}`,
        displayName: profileData.name,
        accountType: profileData.account_type,
        profilePictureUrl: profileData.profile_picture_url,
        biography: profileData.biography,
        accessToken: user.accessToken,
        accessTokenExpires: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        scopes: ['instagram_business_basic', ...],
      }),
    });

    // Update FeedsContext
    if (existingFeed) {
      updateFeed(existingFeed.id, { accessToken, isOAuth: true, ... });
    } else {
      addFeed({ platform, handle, displayName, ... });
    }
  }
}, [searchParams, session, oauthProcessed]);
```

### 5. Token Stored in Database

The `/api/instagram/accounts/connect` endpoint saves the token:

```typescript
// app/api/instagram/accounts/connect/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await request.json();

  // When DB is ready:
  // const account = await prisma.instagramAccount.upsert({
  //   where: { userId_instagramUserId: { ... } },
  //   update: { accessToken: body.accessToken, ... },
  //   create: { ...body, userId: session.user.id },
  // });

  return NextResponse.json({ success: true, account });
}
```

---

## API Endpoints

### GET /api/instagram/profile

Fetch Instagram profile data using an access token.

**Query Parameters**:
- `access_token` (required): Instagram access token

**Response**:
```json
{
  "id": "17841401894033149",
  "username": "gigglelizards",
  "name": "The Giggle Lizards",
  "accountType": "BUSINESS",
  "profilePictureUrl": "https://...",
  "followersCount": 710,
  "followsCount": 2,
  "mediaCount": 244,
  "biography": "Comedy creators",
  "website": "https://..."
}
```

### POST /api/instagram/accounts/connect

Save an Instagram OAuth account to the database.

**Body**:
```json
{
  "instagramUserId": "17841401894033149",
  "handle": "@gigglelizards",
  "displayName": "The Giggle Lizards",
  "accountType": "BUSINESS",
  "profilePictureUrl": "https://...",
  "biography": "Comedy creators",
  "accessToken": "IGABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop...",
  "accessTokenExpires": "2025-05-22T00:00:00Z",
  "scopes": ["instagram_business_basic", "instagram_business_content_publish"]
}
```

**Response**:
```json
{
  "success": true,
  "account": {
    "id": "cuid123",
    "userId": "user-123",
    "instagramUserId": "17841401894033149",
    "handle": "@gigglelizards",
    "isConnected": true,
    "isPrimary": true,
    "createdAt": "2026-03-22T00:00:00Z"
  }
}
```

### GET /api/instagram/accounts/connect

List all connected Instagram accounts for the current user.

**Response**:
```json
{
  "accounts": [
    {
      "id": "cuid123",
      "instagramUserId": "17841401894033149",
      "handle": "@gigglelizards",
      "displayName": "The Giggle Lizards",
      "accountType": "BUSINESS",
      "isConnected": true,
      "isPrimary": true,
      "cachedFollowers": 710,
      "cachedFollowing": 2,
      "cachedMediaCount": 244,
      "lastSyncAt": "2026-03-22T12:00:00Z"
    }
  ],
  "count": 1
}
```

### GET /api/instagram/analytics

Fetch analytics/insights for a connected account.

**Query Parameters**:
- `accountId` OR `accessToken` (one required)
- `period` (optional): lifetime, last_90_days, last_30_days, last_7_days

**Response**:
```json
{
  "success": true,
  "profile": {
    "id": "17841401894033149",
    "username": "gigglelizards",
    "followersCount": 710,
    "followsCount": 2,
    "mediaCount": 244
  },
  "insights": {
    "impressions": 15000,
    "reach": 8500,
    "profile_views": 2300,
    "follower_growth": 15,
    "email_contacts": 0,
    "phone_call_clicks": 5,
    "text_message_clicks": 2,
    "website_clicks": 45
  },
  "period": "last_30_days"
}
```

### GET /api/instagram/comments

Fetch recent comments on posts.

**Query Parameters**:
- `accessToken` (required)
- `limit` (optional): default 10

**Response**:
```json
{
  "success": true,
  "comments": [
    {
      "id": "comment-123",
      "text": "Love this content!",
      "username": "commenter_handle",
      "timestamp": "2026-03-22T10:00:00Z",
      "postId": "post-123",
      "postCaption": "New content...",
      "postImageUrl": "https://..."
    }
  ],
  "count": 5
}
```

### POST /api/instagram/comments

Reply to a comment (requires `instagram_content_publish` permission).

**Body**:
```json
{
  "commentId": "comment-123",
  "accessToken": "IGABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop...",
  "message": "Thanks for the love!"
}
```

**Response**:
```json
{
  "success": true,
  "replyId": "reply-123",
  "message": "Reply posted successfully"
}
```

### POST /api/instagram/publish

Publish a post to Instagram (existing endpoint - already working).

**Body**:
```json
{
  "access_token": "IGABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnop...",
  "instagram_user_id": "17841401894033149",
  "media_type": "IMAGE",
  "media_url": "https://example.com/image.jpg",
  "caption": "Check out this amazing content! #socialmedia #creators"
}
```

**Response**:
```json
{
  "success": true,
  "media_id": "media-123",
  "container_id": "container-456"
}
```

### POST /api/instagram/accounts/refresh-token

Refresh an expiring access token.

**Body**:
```json
{
  "accountId": "cuid123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Token refresh scheduled."
}
```

### GET /api/instagram/accounts/refresh-token (Cron)

Cron job endpoint to refresh all expiring tokens.

**Query Parameters**:
- `cron=1`: Indicates this is a cron job
- `secret`: Matches `CRON_SECRET` environment variable

**Example Vercel Cron Configuration** (vercel.json):
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

### POST /api/instagram/accounts/disconnect

Disconnect an Instagram account.

**Body**:
```json
{
  "accountId": "cuid123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Instagram account disconnected"
}
```

---

## Token Management

### Token Lifecycle

Instagram access tokens expire after **60 days**.

**Timeline**:
- **Day 0**: Token issued, `accessTokenExpires = now + 60 days`
- **Day 53**: Cron job refreshes token (7 days before expiry)
- **Day 113**: New token expires

### Automatic Token Refresh

The system automatically refreshes tokens before expiry:

```typescript
// app/api/instagram/accounts/refresh-token/route.ts
export async function GET(request: NextRequest) {
  // Find all accounts where:
  // - autoRefreshEnabled = true
  // - accessTokenExpires is within 7 days
  // - isConnected = true

  for (const account of expiringAccounts) {
    try {
      const newToken = await refreshInstagramToken(
        account.id,
        account.refreshToken
      );
      // Update database with new token
    } catch (error) {
      // Log error, mark account as needs re-auth
    }
  }
}
```

### Token Storage Security

**In Development** (current):
- Tokens stored in NextAuth Account model (encrypted by NextAuth)
- Also stored in InstagramAccount model (when DB is active)

**In Production** (recommended):
- Use field-level encryption: `@db.String @encrypt`
- Never log access tokens to console
- Use HTTPS only
- Rotate client secrets regularly
- Monitor token usage for suspicious activity

---

## Error Handling

### Common Error Scenarios

#### 1. Invalid Access Token

**Cause**: Token expired or revoked
**Response**: 400 Bad Request
```json
{
  "error": "Invalid access token",
  "details": "The access token provided is invalid"
}
```

**Fix**: User needs to reconnect via OAuth

#### 2. Permission Denied

**Cause**: Missing required permission (e.g., `instagram_business_content_publish`)
**Response**: 403 Forbidden
```json
{
  "error": "Missing required permissions",
  "details": "instagram_content_publish permission not granted"
}
```

**Fix**: May require app review submission if in Development Mode

#### 3. Rate Limiting

**Cause**: Too many API calls to Instagram
**Response**: 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "details": "Please wait before trying again"
}
```

**Fix**: Implement client-side rate limiting, retry with exponential backoff

#### 4. Account Not Found

**Cause**: Instagram account doesn't exist or is private
**Response**: 404 Not Found
```json
{
  "error": "Instagram account not found",
  "details": "The specified account does not exist or is not a business account"
}
```

**Fix**: Verify account is Business/Creator type and publicly available

---

## Setup Checklist

### Phase 1: Database Configuration

- [ ] Ensure `DATABASE_URL` is set (Neon PostgreSQL)
- [ ] Ensure `DIRECT_URL` is set (for Prisma migrations)
- [ ] Run `npx prisma db push` to create tables
- [ ] Verify `InstagramAccount` table exists in database

### Phase 2: Verify OAuth Configuration

- [ ] `META_CLIENT_ID` is set in .env.local
- [ ] `META_CLIENT_SECRET` is set in .env.local
- [ ] `INSTAGRAM_CLIENT_ID` is set in .env.local
- [ ] `INSTAGRAM_CLIENT_SECRET` is set in .env.local
- [ ] `NEXTAUTH_URL` matches Meta app callback URL
- [ ] `NEXTAUTH_SECRET` is set (use `openssl rand -base64 32`)

### Phase 3: Test OAuth Flow

- [ ] OAuth provider is configured in `lib/auth.ts`
- [ ] Callback URL is registered in Meta app settings
- [ ] Test accounts are created in Meta Developer app
- [ ] OAuth flow completes without errors
- [ ] Token is saved to database
- [ ] Token persistence works across browser sessions

### Phase 4: API Endpoints

- [ ] `GET /api/instagram/profile` returns real data
- [ ] `POST /api/instagram/accounts/connect` saves to DB
- [ ] `GET /api/instagram/accounts/connect` returns user's accounts
- [ ] `GET /api/instagram/analytics` fetches real insights
- [ ] `GET /api/instagram/comments` fetches recent comments
- [ ] `POST /api/instagram/publish` publishes a post

### Phase 5: Token Refresh

- [ ] `POST /api/instagram/accounts/refresh-token` works
- [ ] Cron job is configured in Vercel
- [ ] Cron job has `CRON_SECRET` set
- [ ] Tokens are automatically refreshed before expiry

### Phase 6: App Review Submission

- [ ] Privacy policy is updated
- [ ] Meta app review form is completed
- [ ] Screencast is recorded and uploaded
- [ ] Test account credentials are provided
- [ ] Submit for review

---

## Troubleshooting

### Issue: "OAuth callback fails with invalid redirect_uri"

**Diagnosis**: Check Vercel logs and browser console

**Solutions**:
1. Verify `NEXTAUTH_URL` in production matches Meta app callback URL exactly
2. Include trailing slash if needed: `https://yourdomain.com/`
3. Check that the callback URL in Meta app matches the provider ID: `instagram-direct`

### Issue: "Token is stored but next request fails with permission error"

**Diagnosis**: Token might be from wrong OAuth flow

**Solutions**:
1. Verify you're using `instagram-direct` provider, not `instagram` (Facebook login)
2. Make sure test account is Business or Creator type
3. Check that test account is a tester in your Meta app (Settings → Roles → Test Users)

### Issue: "POST to Instagram API fails with 'Invalid media URL'"

**Diagnosis**: Media URL might not be publicly accessible

**Solutions**:
1. Ensure image URL is HTTPS and publicly accessible
2. Test the URL in browser first (should load the image)
3. Check image dimensions are appropriate (Instagram has size limits)
4. For videos, ensure duration < 90 seconds

### Issue: "Cron job not running"

**Diagnosis**: Vercel cron might not be configured

**Solutions**:
1. Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/instagram/accounts/refresh-token?cron=1&secret=YOUR_SECRET",
       "schedule": "0 0 * * *"
     }]
   }
   ```
2. Ensure `CRON_SECRET` is set in Vercel environment variables
3. Check Vercel logs: Deployments → Select deployment → Logs

---

## Testing Locally

### 1. Create a Tunnel to Your Local Dev Server

```bash
# Using Cloudflare Tunnel (free)
npm install -g wrangler
wrangler tunnel create socialexchange
# Copy the tunnel URL

# Or use ngrok
npm install -g ngrok
ngrok http 3000
```

### 2. Update .env.local

```bash
NEXTAUTH_URL=https://your-tunnel-url.com
```

### 3. Update Meta App Callback URL

In Meta Developer Console:
- Settings → Basic → OAuth Redirect URIs
- Change to: `https://your-tunnel-url.com/api/auth/callback/instagram-direct`

### 4. Start Dev Server

```bash
npm run dev
```

### 5. Test OAuth Flow

1. Navigate to `https://your-tunnel-url.com`
2. Go to My Feeds → Add Account → Instagram → OAuth
3. Complete the flow
4. Verify token is saved (check database or NextAuth cookies)

---

## Performance Optimizations

### 1. Token Caching

Cache profile data to reduce API calls:

```typescript
// Cache for 1 hour
const cachedProfile = await cache.get(`instagram:${userId}:profile`);
if (cachedProfile) return cachedProfile;

const profile = await fetchFromInstagram(accessToken);
await cache.set(`instagram:${userId}:profile`, profile, { ttl: 3600 });
```

### 2. Batch API Calls

Fetch multiple metrics in one request:

```typescript
const fields = [
  'id',
  'username',
  'followers_count',
  'follows_count',
  'media_count',
  'biography',
].join(',');

// Single API call instead of multiple
const data = await fetch(`https://graph.instagram.com/me?fields=${fields}&...`);
```

### 3. Rate Limiting

Implement client-side rate limiting to prevent quota exhaustion:

```typescript
const rateLimitStore = new Map<string, number[]>();

export function checkRateLimit(userId: string, limit = 100, window = 3600) {
  const now = Date.now();
  const timestamps = rateLimitStore.get(userId) || [];

  // Keep only timestamps within window
  const recent = timestamps.filter(t => now - t < window * 1000);

  if (recent.length >= limit) {
    throw new Error('Rate limit exceeded');
  }

  recent.push(now);
  rateLimitStore.set(userId, recent);
}
```

---

## Future Enhancements

1. **Instagram Stories**: Support for stories publishing (requires different API endpoint)
2. **Reels & IGTV**: Long-form video content support
3. **User Interactions**: Automated likes, follows, unfollows with safety limits
4. **Content Insights**: Deep analytics (demographics, best posting times)
5. **Hashtag Research**: Track hashtag performance and suggestions
6. **Competitor Tracking**: Monitor competitor accounts and content
7. **Auto-Scheduling**: AI-driven optimal posting times
8. **Multi-Account Management**: Cross-post to multiple accounts
9. **Instagram Shopping**: Product tagging and catalog integration
10. **Direct Messages**: Send DMs from the platform

---

## Resources

- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Meta App Review Guide](https://developers.facebook.com/docs/apps/review)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma ORM Guide](https://www.prisma.io/docs)
- [Instagram Platform Policies](https://www.instagram.com/about/policies/)

---

**Last Updated**: March 22, 2026
**Maintained By**: Claude AI (AI Agent)
