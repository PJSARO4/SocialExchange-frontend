# Meta (Instagram & Facebook) OAuth Setup Guide

This guide walks you through setting up Meta's OAuth for real Instagram and Facebook connections in Social Exchange.

## Prerequisites

Before you begin, ensure you have:
- An Instagram Business or Creator account (not a personal account)
- A Facebook Page connected to your Instagram account
- A Facebook Developer account (free to create)

## Step 1: Convert to Business/Creator Account (if needed)

If your Instagram is a personal account:

1. Open Instagram app → Profile → Menu (≡) → Settings
2. Go to "Account" → "Switch to Professional Account"
3. Choose "Creator" or "Business"
4. Follow the prompts to complete setup

## Step 2: Connect Instagram to Facebook Page

1. Open Facebook and go to your Page
2. Click "Settings" → "Instagram"
3. Click "Connect Account" and log into Instagram
4. Follow the prompts to link them

## Step 3: Create a Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Log in with your Facebook account
3. Click "My Apps" → "Create App"
4. Select "Business" as the app type
5. Enter app details:
   - App name: "Social Exchange" (or your preference)
   - Contact email: Your email
   - Business Account: Select or create one
6. Click "Create App"

## Step 4: Add Required Products

In your new app dashboard:

### Add Facebook Login for Business
1. From the dashboard, click "Add Products"
2. Find "Facebook Login for Business" → Click "Set Up"
3. Skip the quickstart, go to "Settings" under Facebook Login
4. Under "Valid OAuth Redirect URIs", add:
   ```
   http://localhost:3000/api/auth/callback/instagram
   https://yourdomain.com/api/auth/callback/instagram
   ```
5. Save Changes

### Add Instagram Graph API
1. From the dashboard, click "Add Products"
2. Find "Instagram Graph API" → Click "Set Up"
3. This enables Instagram API access through your app

## Step 5: Configure Permissions

1. Go to "App Review" → "Permissions and Features"
2. Request access to these permissions:
   - `instagram_basic` - Read profile info
   - `instagram_content_publish` - Post content
   - `instagram_manage_insights` - Read analytics
   - `pages_show_list` - List connected pages
   - `pages_read_engagement` - Read page engagement
   - `business_management` - Access business accounts

Note: Some permissions require App Review for production use. For development/testing, you can use them in Development Mode with admin users.

## Step 6: Get Your Credentials

1. Go to "Settings" → "Basic"
2. Copy your:
   - **App ID** → This is your `META_CLIENT_ID`
   - **App Secret** → Click "Show" and copy → This is your `META_CLIENT_SECRET`

## Step 7: Configure Social Exchange

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   META_CLIENT_ID="your-app-id-here"
   META_CLIENT_SECRET="your-app-secret-here"

   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-a-random-string"
   ```

3. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

## Step 8: Set Up Database

1. Ensure PostgreSQL is running
2. Update `DATABASE_URL` in `.env.local`
3. Run Prisma migrations:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

## Step 9: Test the Connection

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/cockpit/my-e-assets/my-feeds`

3. Click "Add Feed" → Select Instagram → Click "Connect with Facebook"

4. You'll be redirected to Facebook's OAuth screen

5. Grant the requested permissions

6. You'll be redirected back with your Instagram account connected!

## Troubleshooting

### "App Not Set Up" Error
- Ensure your app is in Development Mode or has been reviewed
- Add yourself as an Admin/Developer in App Roles

### "Invalid Redirect URI" Error
- Check that the OAuth redirect URI exactly matches what's in your app settings
- Include the full path: `/api/auth/callback/instagram`

### No Instagram Accounts Found
- Ensure your Instagram is a Business/Creator account
- Verify it's connected to a Facebook Page
- The Page must be linked to your Facebook Developer account

### Token Expired
- Meta tokens expire after 60 days
- Social Exchange automatically refreshes them when possible
- If expired, reconnect the account

## Production Deployment

For production:

1. Submit your app for App Review to use permissions with non-admin users
2. Update redirect URIs to your production domain
3. Enable HTTPS (required by Meta)
4. Set `NEXTAUTH_URL` to your production URL

## API Rate Limits

Meta enforces rate limits:
- 200 calls per user per hour for Instagram Graph API
- Social Exchange caches data to minimize API calls
- Metrics refresh automatically every 6 hours

## Security Best Practices

- Never expose `META_CLIENT_SECRET` in client-side code
- Use environment variables for all credentials
- Rotate secrets periodically
- Monitor your app's API usage in Meta Developer Dashboard

---

Need help? Check the [Meta Graph API Documentation](https://developers.facebook.com/docs/graph-api) or [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api).
