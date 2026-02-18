# Social Exchange — Complete API Permissions List
## All APIs, Keys, and Permissions Required

---

## 1. META / INSTAGRAM API

### Credentials Required
| Variable | Source | Status |
|----------|--------|--------|
| `META_CLIENT_ID` | Meta for Developers → App Settings → Basic | ✅ Configured |
| `META_CLIENT_SECRET` | Meta for Developers → App Settings → Basic | ✅ Configured |
| `INSTAGRAM_CLIENT_ID` | Meta for Developers → Instagram API setup | ✅ Configured |
| `INSTAGRAM_CLIENT_SECRET` | Meta for Developers → Instagram API setup | ✅ Configured |

### Permissions (Scopes) Required
| Permission | Purpose | App Review? | Status |
|------------|---------|-------------|--------|
| `instagram_basic` | Read profile info, media list | Dev mode: no | ✅ Available in dev |
| `instagram_content_publish` | Post photos, videos, reels, carousels | **YES** | ⚠️ Needs App Review |
| `instagram_manage_insights` | Read account analytics & post insights | **YES** | ⚠️ Needs App Review |
| `instagram_manage_comments` | Read/reply to comments | **YES** | 🔲 Not yet requested |
| `instagram_manage_messages` | Read/send DMs (Messenger API) | **YES** | 🔲 Not yet requested |
| `pages_show_list` | List Facebook Pages (required for IG Business) | Dev mode: no | ✅ Available in dev |
| `pages_read_engagement` | Read page engagement data | Dev mode: no | ✅ Available in dev |
| `business_management` | Access Business Manager accounts | Dev mode: no | ✅ Available in dev |
| `ads_management` | Manage Instagram ads (future) | **YES** | 🔲 Future feature |
| `catalog_management` | Instagram Shopping / product tags (future) | **YES** | 🔲 Future feature |

### App Review Requirements (for production)
To use these permissions with non-admin users, Meta requires:
1. **Privacy Policy URL** — Must be publicly accessible
2. **Data Deletion Request URL** — Endpoint for GDPR compliance
3. **Business Verification** — Verify business documents
4. **App Review Submission** — Per-permission with use case description
5. **Screencast/Video** — Showing how each permission is used in your app

### Rate Limits
- 200 API calls per user per hour (Instagram Graph API)
- 25 content publishing limit per 24 hours per account
- Content publishing limit check: `GET /{ig-user-id}/content_publishing_limit`

### What Works in Development Mode (No App Review)
- ✅ OAuth login for app admins/developers/testers
- ✅ Read profile data
- ✅ Read media/posts
- ✅ Publish content (admin accounts only)
- ✅ Read insights (admin accounts only)
- ❌ Cannot work for non-admin users

---

## 2. STRIPE (Payments)

### Credentials Required
| Variable | Source | Status |
|----------|--------|--------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys | ❌ **NOT SET** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys | ❌ **NOT SET** |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Signing Secret | ❌ **NOT SET** |

### Setup Steps (Human Required)
1. Create account at https://stripe.com
2. Go to https://dashboard.stripe.com/apikeys
3. Copy Publishable Key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Copy Secret Key → `STRIPE_SECRET_KEY`
5. Create webhook endpoint at https://dashboard.stripe.com/webhooks
   - Endpoint URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`, `transfer.created`
   - Copy Signing Secret → `STRIPE_WEBHOOK_SECRET`

### Features Already Built
| Feature | Route | Stripe Product |
|---------|-------|---------------|
| Deposit (buy SExCOINS) | `/api/stripe/checkout` | Stripe Checkout |
| Withdraw (sell SExCOINS) | `/api/stripe/connect` | Stripe Connect Express |
| Webhook handler | `/api/stripe/webhook` | Stripe Webhooks |

### Stripe Connect (for creator payouts)
- Uses Express accounts (simplest setup)
- Creators onboard via Stripe-hosted form
- Platform receives deposits, distributes to connected accounts
- 10% withdrawal fee built in

### What Works Without Keys
- ✅ Demo mode wallet (localStorage-based deposits/withdrawals)
- ❌ Real money transactions require Stripe keys
- ❌ Bank account linking requires Stripe Connect

### Compliance Notes
- Stripe handles PCI DSS compliance (card data never touches our servers)
- KYC/identity verification handled by Stripe Connect onboarding
- Money transmitter licensing may apply depending on state — consult legal

---

## 3. ANTHROPIC API (AI Copilot)

### Credentials Required
| Variable | Source | Status |
|----------|--------|--------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ | ✅ Configured |

### Features Using This API
| Feature | Route | Model |
|---------|-------|-------|
| AI Chat (Copilot) | `/api/copilot/chat` | claude-sonnet-4-5-20250929 |
| Content Generation | `/api/copilot/generate` | claude-sonnet-4-5-20250929 |

### Rate Limits
- Depends on plan tier (Free: 50 messages/day, Pro: higher limits)
- API rate limits: check https://docs.anthropic.com/en/api/rate-limits

---

## 4. NEXTAUTH (Authentication)

### Credentials Required
| Variable | Source | Status |
|----------|--------|--------|
| `NEXTAUTH_URL` | Your app URL | ✅ Configured |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | ✅ Configured |

---

## 5. DATABASE (PostgreSQL + Prisma)

### Credentials Required
| Variable | Source | Status |
|----------|--------|--------|
| `DATABASE_URL` | PostgreSQL connection string | ⚠️ Local Prisma Postgres |

### Notes
- Currently using Prisma Postgres local dev server
- For production: need hosted PostgreSQL (Supabase, Neon, Railway, or AWS RDS)
- Run `npx prisma migrate dev` after database setup

---

## 6. OPTIONAL / FUTURE APIs

### File Storage (for content uploads)
| Option | Variables | Status |
|--------|-----------|--------|
| AWS S3 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` | 🔲 Not configured |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | 🔲 Not configured |
| Local | `UPLOAD_DIR=./uploads` | ✅ Default |

### Real-time Notifications
| Option | Variables | Status |
|--------|-----------|--------|
| Pusher | `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | 🔲 Not configured |

### Future Platforms
| Platform | API | Status |
|----------|-----|--------|
| TikTok | TikTok Content Posting API | 🔲 Research needed |
| YouTube | YouTube Data API v3 | 🔲 Research needed |
| Twitter/X | X API v2 | 🔲 Research needed |
| LinkedIn | LinkedIn Marketing API | 🔲 Research needed |

---

## Quick Setup Checklist

### Immediate (Can do now)
- [x] Meta/Instagram credentials configured
- [x] Anthropic API key configured
- [x] NextAuth configured
- [x] All API routes built
- [ ] **Add `STRIPE_SECRET_KEY`** to `.env.local`
- [ ] **Add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** to `.env.local`
- [ ] **Add `STRIPE_WEBHOOK_SECRET`** to `.env.local`

### Tomorrow (User action required)
- [ ] Connect Instagram Business account via OAuth
- [ ] Set up Stripe account and get API keys
- [ ] Test Instagram publishing with admin account

### Later (Business requirements)
- [ ] Submit Meta App Review for production permissions
- [ ] Set up hosted PostgreSQL database
- [ ] Configure file storage (S3 or Cloudinary)
- [ ] Set up Pusher for real-time notifications
- [ ] Legal review for money transmitter compliance
