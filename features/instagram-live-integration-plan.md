# Instagram Live Integration Plan
## Social Exchange — PJ + Reed Work Session Prep
> Date: June 27, 2026  
> Goal: Every user who creates a Social Exchange account can connect their Instagram and see LIVE stats

---

## THE BRIDGE: What "Operational" Means

A user is **operational** on Social Exchange when:
1. They create an SE account (✅ done)
2. They connect their Instagram via OAuth (🟡 code built, blocked by Meta App setup)
3. Their real followers, posts, engagement load in the dashboard (🟡 blocked by same)
4. The data refreshes on a schedule (💡 not built yet)

Everything downstream — automation, scheduling, analytics, ads, EarnEx, Trading Post valuations — depends on step 2 and 3 working.

---

## CURRENT STATE: What's Already Built

The codebase is 80% ready. The OAuth plumbing exists:

```
lib/auth.ts                              ← Two Instagram providers configured
app/lib/social/instagram.ts             ← Full Graph API client (v21.0)
app/api/feeds/instagram/connect/route.ts ← OAuth callback handler
app/api/instagram/profile/route.ts      ← Profile data fetcher
app/api/instagram/accounts/connect/route.ts ← Token storage
app/cockpit/my-e-assets/my-feeds/MyFeedsContent.tsx ← OAuth callback processor
```

The ONE blocker: **No real Meta App credentials are configured on Vercel.**

---

## PHASE 1: Get the First User Live (Instagram)
### Estimated time: 1–2 days of setup, no coding

### Step 1 — Create the Meta Developer App

1. Go to https://developers.facebook.com/apps/
2. Click **Create App**
3. Choose use case: **"Other"** → then **Business**
4. App name: `Social Exchange` (or `SocialExchangeApp`)
5. App contact email: pjsaro4@gmail.com

**Add these two products inside the app:**
- **Instagram** → "API setup with Instagram Login" (Business Login for Instagram)
- **Facebook Login for Business** (for Facebook-linked IG accounts)

> **Which login type to use?**  
> The codebase already has BOTH configured. Start with **Business Login for Instagram** (no Facebook Page required — users just use their Instagram credentials). This is simpler for the end user. The `instagram-direct` provider in auth.ts is already set up for this.

### Step 2 — Configure OAuth Redirect URIs

In Meta App Dashboard → Instagram → API setup with Instagram Login → **OAuth redirect URIs**, add:

```
https://social-exchange-frontend-8zl2.vercel.app/api/auth/callback/instagram-direct
http://localhost:3000/api/auth/callback/instagram-direct
```

### Step 3 — Get the App Credentials

From the App Dashboard:
- **Instagram App ID** (found under Instagram → API setup with Instagram Login)
- **Instagram App Secret** (same section)

These are DIFFERENT from the Meta App ID at the top of the dashboard.

### Step 4 — Set Environment Variables on Vercel

Go to Vercel → Social Exchange project → Settings → Environment Variables. Add:

```
INSTAGRAM_CLIENT_ID       = [Instagram App ID from step 3]
INSTAGRAM_CLIENT_SECRET   = [Instagram App Secret from step 3]
META_CLIENT_ID            = [Meta App ID from top of dashboard]  
META_CLIENT_SECRET        = [Meta App Secret]
```

These map to the `.env.local.example` variables already in the repo.

### Step 5 — Test with a Test User

At this point the app is in **Standard Access** mode, which means:
- Only users who have a **role on the Meta App** (Developer, Tester, Admin) can connect
- This is perfect for PJ and Reed to test as the first users
- Go to Meta App Dashboard → Roles → Add PJ and Reed as Testers

Then go to `/cockpit/my-e-assets/my-feeds`, click **Add Account**, select Instagram, click **Connect Account**. If the credentials are right, OAuth will complete and real data will load.

### Step 6 — Verify Real Data Loads

After OAuth completes, `MyFeedsContent.tsx` calls `/api/instagram/profile?access_token=...` which hits:
```
graph.instagram.com/v21.0/me?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,account_type
```

Real follower count, media count, and profile picture should appear in the dashboard.

---

## PHASE 2: Open to All Users (App Review)

Once PJ and Reed confirm it works, you need Meta App Review to allow any Instagram user to connect (not just testers).

### Permissions to request:

| Permission | What it unlocks |
|------------|----------------|
| `instagram_business_basic` | Profile, follower count, media count ← **start here** |
| `instagram_business_content_publish` | Post scheduling, create post feature |
| `instagram_business_manage_insights` | Engagement rate, reach, impressions analytics |
| `instagram_business_manage_comments` | Comment moderation (Comms section) |
| `instagram_business_manage_messages` | DM management (Comms section) |

### App Review Process:
1. Complete **Business Verification** (Meta verifies SE is a real business)
2. Record a **screencast demo** of the OAuth flow and what the app does with the data
3. Submit each permission for review with a use-case description
4. Timeline: typically 1–5 business days per permission
5. After approval → **Advanced Access** → any Instagram user can connect

> **Key requirement:** App must have a live, working UI that reviewers can test. Social Exchange on Vercel qualifies.

---

## PHASE 3: Token Refresh & Data Sync

After OAuth connects, the token expires in **60 days**. Need:

### 3A — Token Refresh (immediate need)
Instagram long-lived tokens can be refreshed before expiry using:
```
GET https://graph.instagram.com/v21.0/refresh_access_token
   ?grant_type=ig_refresh_token
   &access_token={long-lived-token}
```

Implement a Vercel Cron job (`/api/cron/refresh-tokens`) that runs daily and refreshes any token expiring within 7 days. Store updated `tokenExpiresAt` in DB.

### 3B — Scheduled Data Sync
Currently data only updates when the user opens the page. Need background sync:

- Vercel Cron: `/api/cron/sync-feeds` — runs every 15 mins or hourly
- For each active OAuth feed: fetch fresh metrics, update the `Feed` record
- UI shows "Last synced 5 min ago" instead of real-time pull

DB fields already exist: `lastSync`, `metrics` on the Feed model.

---

## PHASE 4: Other Platforms

Once Instagram is live, the same OAuth pattern applies:

| Platform | API | Complexity |
|----------|-----|-----------|
| **Facebook Pages** | Graph API (same app) | Low — same Meta app, add pages_show_list permission |
| **TikTok** | TikTok for Business API | Medium — separate developer account at developers.tiktok.com |
| **X / Twitter** | Twitter API v2 | Medium — separate app at developer.twitter.com, OAuth 2.0 |
| **YouTube** | YouTube Data API v3 | Medium — Google Cloud Console, OAuth 2.0 |
| **LinkedIn** | LinkedIn API | Medium — LinkedIn Developer Portal |

AddAccountModal already shows all 4 platforms. The backend providers just need to be added to `lib/auth.ts` with the same pattern as Instagram.

---

## PHASE 5: Features Unlocked Once Live

With real OAuth tokens flowing, these features unlock WITHOUT new backend work (just remove mock data):

| Feature | What to wire |
|---------|-------------|
| Live follower count | Already fetched in `getInstagramProfile()` |
| Live engagement rate | Already in `getAccountInsights()` in instagram.ts |
| Recent posts grid | GET /me/media?fields=id,caption,media_type,timestamp,like_count,comments_count,permalink |
| Post scheduling | Content publishing API — already have permission in scope |
| Analytics dashboard | Insights API — daily/weekly breakdowns |
| Trading Post valuations | Auto-calculate from live followers + engagement |

---

## IMMEDIATE ACTION ITEMS (for tonight's session)

| # | Action | Who | Time |
|---|--------|-----|------|
| 1 | Create Meta Developer App at developers.facebook.com | PJ | 10 min |
| 2 | Add "Instagram API with Instagram Login" product | PJ | 5 min |
| 3 | Add redirect URIs for Vercel + localhost | PJ | 5 min |
| 4 | Copy Instagram App ID + Secret from dashboard | PJ | 2 min |
| 5 | Add `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET` to Vercel env vars | PJ | 5 min |
| 6 | Redeploy on Vercel (or just trigger a new deployment) | PJ/Reed | 2 min |
| 7 | Add PJ + Reed as Testers in Meta App Roles | PJ | 5 min |
| 8 | Test OAuth flow: Add Account → Instagram → Connect | Both | 10 min |
| 9 | Confirm live stats appear in dashboard | Both | — |
| 10 | Begin App Review submission if test passes | PJ | 30–60 min |

Total setup: ~1 hour

---

## ARCHITECTURE MAP (for mind map)

```
USER CREATES SE ACCOUNT
         │
         ▼
   CONNECTS INSTAGRAM
   (OAuth — Business Login for Instagram)
         │
         ▼
   META GRANTS ACCESS TOKEN (60-day long-lived)
         │
         ├──→ PROFILE: followers, following, mediaCount, bio
         ├──→ INSIGHTS: engagement, reach, impressions
         ├──→ MEDIA: recent posts, captions, likes, comments
         └──→ STORED IN: Feed model (Neon DB via Prisma)
                    │
                    ├──→ MY FEEDS DASHBOARD (live telemetry)
                    ├──→ ANALYTICS MODAL (trends over time)
                    ├──→ SCHEDULER (publish via Content Publishing API)
                    ├──→ AUTOMATION (trigger rules via autopilot mode)
                    ├──→ TRADING POST (auto-value account on listing)
                    └──→ EARNEX (monetization metrics)
```

---

## RISKS / GOTCHAS

1. **Meta App Review takes time.** Standard Access = testers only. Plan for 1–2 weeks to get Advanced Access approved before marketing to public.

2. **Instagram Business/Creator account required.** Personal Instagram accounts cannot use the Business API. Users need to convert their account to Professional (free, takes 2 min in app settings).

3. **Facebook Page not required** if using Business Login for Instagram (the `instagram-direct` provider). This is the easier path for users.

4. **Token refresh must be automated.** If tokens expire and aren't refreshed, user appears "disconnected" with no warning. Build the cron job in Phase 3 before launch.

5. **Rate limits.** Formula: `4800 × number of impressions per 24h`. For small accounts this is generous. For large-follower accounts, batch API calls.

6. **Test user accounts.** For Meta App Review, reviewers will test the app. Create a clean test Instagram Business account they can use. Do not use PJ's real account for this.
