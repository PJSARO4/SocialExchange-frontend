# Social Exchange — Feature Inventory
> Extracted from codebase audit + live site review  
> Date: June 27, 2026  
> Status tags: ✅ Built (code exists) | 🟡 Wired (code exists, needs live data/API keys) | 🔴 Designed (UI only, no backend) | 💡 Implied (referenced but not built)

---

## PLATFORM OVERVIEW

Social Exchange is a social media management + account marketplace platform.  
Six top-level cockpit sections:

1. **E-Feeds** (My Feeds) — connect & manage social accounts
2. **E-Shares** — equity/share issuance for social accounts
3. **Marketplace** → now redirects to **Trading Post**
4. **Comms** — messaging/communications hub
5. **Trading Post** — buy & sell social media accounts
6. **Command Center** — admin/analytics command layer

---

## SECTION 1: E-FEEDS (My Feeds)

### Core Account Management
| Feature | Status | Notes |
|---------|--------|-------|
| Add Account (Instagram, TikTok, Facebook, X/Twitter, YouTube, LinkedIn) | ✅ | AddAccountModal.tsx — OAuth + manual entry |
| Manual account entry (handle + platform) | ✅ | Works today |
| OAuth connect via Instagram Business Login | 🟡 | Code complete, needs Meta App credentials + App Review |
| OAuth connect via Facebook Login for Business | 🟡 | Code complete, needs Meta App + Page link |
| Account list / feed panel | ✅ | FeedsList panel |
| Connected Account Card (avatar, handle, platform badge, status) | ✅ | ConnectedAccountCard.tsx |
| Upgrade manual feed → OAuth (merge flow) | ✅ | In MyFeedsContent.tsx useEffect |
| Multi-account support (multiple accounts per platform) | ✅ | FeedsContext handles array |

### Telemetry (Live Stats per Account)
| Feature | Status | Notes |
|---------|--------|-------|
| Followers count | 🟡 | Instagram: `followersCount` from Graph API. Showing dummy data. |
| Following count | 🟡 | Instagram: `followsCount` |
| Engagement rate | 🟡 | Calculated from insights |
| Posts/week | 🟡 | Derived from media count over time |
| Uptime % | 🔴 | No backend calculation yet |
| Last post timestamp | 🟡 | `lastPostAt` in Feed model |
| Total posts (media count) | 🟡 | Instagram: `mediaCount` |
| Avg likes / avg comments | 🟡 | From media insights |

### Control Modes (Operating Mode per Account)
| Mode | Status | Notes |
|------|--------|-------|
| AUTOPILOT — full automation | 🔴 | Toggle exists, automation engine not built |
| ESCROW — queue for review | 🔴 | Mode set in DB, queue system not built |
| MANUAL — manual posting only | ✅ | Default mode |
| OBSERVE — monitor only, no actions | ✅ | Passive mode, telemetry only |

### Automation
| Feature | Status | Notes |
|---------|--------|-------|
| Automation toggle (ARMED / IDLE) | ✅ | UI complete, stored in DB |
| AutomationModal | ✅ | AutomationModal.tsx |
| Chain Builder (automation workflow chains) | 🔴 | `chain-builder/` folder exists, engine not wired |
| Automation Status Panel | ✅ | AutomationStatusPanel.tsx |
| Trigger-based automation rules | 💡 | Referenced in chain-builder, not implemented |

### Quick Actions (per account workspace)
| Action | Status | Notes |
|--------|--------|-------|
| Create Post | ✅ | CreatePostModal — publishes via Instagram API |
| Scheduler | ✅ | Opens SchedulerModal |
| Analytics | ✅ | Opens AnalyticsModal |
| Settings | ✅ | Opens SettingsModal per account |
| AI Copilot | ✅ | CopilotModal.tsx |
| Automation | ✅ | Opens AutomationModal |
| Content Finder | ✅ | ContentFinderModal.tsx |
| LinkEx | ✅ | LinkExModal.tsx |

### Recent Posts (Feed Workspace)
| Feature | Status | Notes |
|---------|--------|-------|
| Display recent posts grid | 🟡 | UI exists, needs live API data |
| Link to post on platform | ✅ | `permalink` field on post |
| View all posts → Content tab | ✅ | Navigation wired |

### Scheduler
| Feature | Status | Notes |
|---------|--------|-------|
| Calendar view | ✅ | CalendarView.tsx |
| Post queue | ✅ | PostQueue.tsx |
| Schedule post modal | ✅ | SchedulePostModal.tsx |
| Time slot grid | ✅ | TimeSlotGrid.tsx |
| Week header | ✅ | WeekHeader.tsx |
| Publish scheduled posts via API | 🟡 | Needs live API connection |

### Analytics
| Feature | Status | Notes |
|---------|--------|-------|
| Analytics modal/dashboard | ✅ | AnalyticsDashboard.tsx, AnalyticsModal |
| Feed analytics readout | ✅ | FeedAnalyticsReadout.tsx |
| Insights from Instagram API | 🟡 | `getAccountInsights()` built, needs live tokens |

### Content Library
| Feature | Status | Notes |
|---------|--------|-------|
| Content library viewer | ✅ | ContentLibrary component |
| Content uploader | ✅ | ContentUploader.tsx |
| CSV importer | ✅ | CSVImporter in content-library |
| Content storage (E-Storage integration) | ✅ | MyEStorageContent integrated |

### AI Copilot
| Feature | Status | Notes |
|---------|--------|-------|
| AI Copilot modal | ✅ | CopilotModal.tsx |
| Content suggestions / caption writing | 💡 | UI present, AI backend not confirmed |

### Content Finder
| Feature | Status | Notes |
|---------|--------|-------|
| Content Finder modal | ✅ | ContentFinderModal.tsx |
| Hashtag/trend search | 💡 | Meta requires `Instagram Public Content Access` feature |

### Advertise
| Feature | Status | Notes |
|---------|--------|-------|
| Ad Creator modal | ✅ | AdCreatorModal.tsx |
| Advertise tab | ✅ | AdvertiseTab.tsx |
| Campaign creation | 💡 | Needs Meta Ads API |

### EarnEx
| Feature | Status | Notes |
|---------|--------|-------|
| EarnEx tab | ✅ | EarnExTab.tsx |
| Monetization dashboard | 🔴 | UI exists, revenue logic not built |

### Competitors
| Feature | Status | Notes |
|---------|--------|-------|
| Competitors tab | ✅ | CompetitorsTab.tsx |
| Competitor tracking | 🔴 | UI exists, competitor API not wired |

### LinkEx
| Feature | Status | Notes |
|---------|--------|-------|
| LinkEx modal | ✅ | LinkExModal.tsx |
| Link exchange / bio link tool | 🔴 | UI exists, backend not built |

### Feed Ownership
| Feature | Status | Notes |
|---------|--------|-------|
| Feed Ownership Card | ✅ | FeedOwnershipCard.tsx |
| Share Issuance Panel | ✅ | ShareIssuancePanel.tsx |
| Mode Selector | ✅ | ModeSelector.tsx |

### Onboarding / Tutorial
| Feature | Status | Notes |
|---------|--------|-------|
| Page Tutorial overlay | ✅ | PageTutorial.tsx |

---

## SECTION 2: E-SHARES

| Feature | Status | Notes |
|---------|--------|-------|
| E-Shares dashboard | 🟡 | Exists in cockpit, partially built |
| Share issuance for social accounts | ✅ | ShareIssuancePanel in my-feeds |
| Equity tokenization | 💡 | Concept referenced, not implemented |

---

## SECTION 3: TRADING POST (Account Marketplace)

### Browse Marketplace
| Feature | Status | Notes |
|---------|--------|-------|
| Browse page with search | ✅ | /cockpit/trading-post/browse |
| Filter by platform (Instagram, TikTok, YouTube, Twitter, Facebook) | ✅ | Query params |
| Filter by niche | ✅ | Query params |
| Price range filter | ✅ | Min/max inputs |
| Sort (price, followers, engagement) | ✅ | Dropdown |
| Listing cards with hover effects | ✅ | ListingCard component |
| Skeleton loading states | ✅ | |
| Platform category quick-links | ✅ | On trading-post home page |

### Sell My Account
| Feature | Status | Notes |
|---------|--------|-------|
| 4-step wizard (Platform → Details → Pricing → Review) | ✅ | /cockpit/trading-post/sell |
| Platform selection | ✅ | Step 1 |
| Account details entry | ✅ | Step 2 |
| Pricing with live payout breakdown (10% platform fee) | ✅ | Step 3 |
| Submit listing to API | ✅ | POST /api/marketplace/listings |
| Success screen with link to listing | ✅ | Step 4 |

### My Listings
| Feature | Status | Notes |
|---------|--------|-------|
| View all my listings | ✅ | /cockpit/trading-post/my-listings |
| Status badges (ACTIVE, PENDING, SOLD, DELISTED) | ✅ | Color-coded |
| Stats summary (active, pending, sold counts + total value) | ✅ | |
| Filter tabs by status | ✅ | |
| Delist active listing | ✅ | POST /api/marketplace/listings/[id]/delist |
| Escrow link for pending sales | ✅ | Links to escrow page |

### Saved Items
| Feature | Status | Notes |
|---------|--------|-------|
| Save a listing | ✅ | POST /api/marketplace/saved |
| View saved listings | ✅ | /cockpit/trading-post/saved |
| Remove saved listing | ✅ | DELETE /api/marketplace/saved/[id] |
| Sold items greyed out as "No Longer Available" | ✅ | |
| Saves counter on listing | ✅ | Incremented on save |

### Escrow System
| Feature | Status | Notes |
|---------|--------|-------|
| Escrow creation on purchase | ✅ | |
| Escrow status flow (PENDING → TRANSFER_PREP → CREDENTIALS_SENT → COMPLETE) | ✅ | |
| Seller credentials submission | ✅ | TransferPrepPanel |
| Buyer confirmation | ✅ | |
| Escrow detail page | ✅ | |

### Wallet
| Feature | Status | Notes |
|---------|--------|-------|
| Wallet balance API | ✅ | |
| Stripe deposit flow | ✅ | |
| USD throughout (not coins) | ✅ | |

---

## SECTION 4: COMMS

| Feature | Status | Notes |
|---------|--------|-------|
| Communications hub | 💡 | Section named in nav, not built |
| DM management | 💡 | Meta API supports `instagram_manage_messages` |
| Comment moderation | 💡 | Meta API supports `instagram_manage_comments` |

---

## SECTION 5: COMMAND CENTER

| Feature | Status | Notes |
|---------|--------|-------|
| Admin dashboard | ✅ | Built for pjsaro4@gmail.com |
| Platform analytics | 💡 | |
| User management | 💡 | |

---

## SECTION 6: AUTH / ACCOUNT SYSTEM

| Feature | Status | Notes |
|---------|--------|-------|
| Sign up / create account | ✅ | |
| Sign in with email + password | ✅ | /auth/signin → /cockpit/home |
| NextAuth CredentialsProvider | ✅ | JWT sessions |
| Password hashing (bcrypt) | ✅ | |
| Session management | ✅ | |
| OAuth social login (Instagram) | 🟡 | Configured, needs Meta App credentials |

---

## DATABASE MODELS (Prisma)

| Model | Status |
|-------|--------|
| User | ✅ |
| Feed (SocialFeed / connected accounts) | ✅ |
| Listing | ✅ |
| SavedListing | ✅ |
| Escrow | ✅ |
| Wallet | ✅ |
| Transaction | ✅ |
| Post (scheduled posts) | ✅ |

---

## SUPPORTED PLATFORMS (type definitions)

instagram | tiktok | facebook | twitter | youtube | linkedin

---

## CONNECTED APIs (Infrastructure)

| API | Status |
|-----|--------|
| Meta Graph API v21.0 (graph.facebook.com) | 🟡 Client built, needs credentials |
| Instagram Platform API (graph.instagram.com) | 🟡 Client built, needs credentials |
| Stripe | ✅ Wired for deposits |
| Neon PostgreSQL via Prisma | ✅ Live |
| NextAuth | ✅ Live |
| Vercel deployment | ✅ Live |
