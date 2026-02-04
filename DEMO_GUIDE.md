# Social Exchange - Demo Guide

## 🚀 Quick Setup for Demo

### Prerequisites
1. Node.js 18+ installed
2. PostgreSQL running locally (or use the demo without DB)
3. An Instagram Business/Creator account (for live posting)
4. (Optional) Anthropic API key for AI Copilot

### Environment Setup

1. **Start a tunnel for OAuth callbacks** (Instagram requires HTTPS):
   ```bash
   # Using cloudflared (recommended)
   cloudflared tunnel --url http://localhost:3000

   # Or ngrok
   ngrok http 3000

   # Or localtunnel
   npx localtunnel --port 3000
   ```

2. **Update `.env.local`** with your tunnel URL:
   ```env
   NEXTAUTH_URL=https://your-tunnel-url.com

   # Add your real Anthropic API key for AI Copilot
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
   ```

3. **Start the dev server**:
   ```bash
   npm run dev
   ```

4. **Access on mobile**: Open the tunnel URL on your iPhone

---

## 📱 Demo Flow (Step by Step)

### Step 1: The Cinematic Entrance
**URL**: Your tunnel URL (e.g., `https://xxx.trycloudflare.com`)

1. The starfield animation plays automatically
2. **Tap anywhere** to start the ambient audio (sci-fi soundscape)
3. You'll see "SYSTEM ONLINE • AWAITING OPERATOR"

### Step 2: Authentication
1. Tap **"AUTHENTICATE"**
2. Use demo credentials:
   - Email: `demo@example.com`
   - Password: `Demo@2024!User`
3. Or create a new account

### Step 3: Enter the Cockpit
1. After login, tap **"ENTER MISSION CONTROL"**
2. Watch the warp-speed transition
3. **Welcome Experience** shows (first time per session):
   - Animated greeting
   - Quick stats
   - Destination shortcuts

### Step 4: Command Center Dashboard
You're now in the main dashboard showing:
- Personalized greeting
- Stats overview (followers, engagement, etc.)
- Recent activity feed
- Market trends
- Quick navigation cards

### Step 5: Connect Instagram Account
**Navigate to**: My E-Assets → My Feeds

1. In the **Workspace** tab, click **"+ Connect Account"**
2. Select **Instagram**
3. You'll be redirected to Instagram for OAuth
4. Authorize the app
5. Your account appears in the feeds list!

### Step 6: AI Copilot Demo
1. Click the **"🧠 Copilot"** button
2. The Marketing Copilot opens
3. Try these prompts:
   - "Help me create a 30-day growth plan"
   - "What content pillars should I focus on?"
   - "Generate content ideas for this week"
4. Use **Quick Actions** for instant help

**To generate captions/hashtags via API**:
1. Make sure `ANTHROPIC_API_KEY` is set in `.env.local`
2. The API endpoint `/api/copilot/generate` supports:
   - `type: "caption"` - Instagram captions
   - `type: "hashtags"` - Strategic hashtag sets
   - `type: "bio"` - Bio optimization
   - `type: "strategy"` - Content strategy

### Step 7: Upload Content
1. Go to **Content Library** tab
2. Click **"Upload"** or drag & drop images
3. Content appears in your library
4. You can also use **CSV Import** for bulk content

### Step 8: Schedule a Post
1. Go to **Scheduler** tab
2. Click on a day/time slot
3. The **Schedule Modal** opens:
   - Select content from library
   - Write/generate caption
   - Add hashtags
   - Set publish time
4. Click **"Schedule Post"**

### Step 9: Enable Automation
1. Go back to **Workspace** tab
2. Click on your connected feed
3. In the **Control Mode** section:
   - **Manual**: You control everything
   - **Autopilot**: 🤖 Full automation - posts go live automatically
   - **Escrow**: Semi-auto - queues content for approval
   - **Observation**: Read-only monitoring

4. Toggle **"Automation"** to ON
5. The feed shows "AUTOPILOT ENGAGED"

### Step 10: Post Publishing (Live Demo)
To publish immediately to Instagram:
1. Have content scheduled or use "Post Now"
2. The system calls `/api/instagram/publish`
3. Supports: Images, Videos, Carousels, Reels

---

## 🎯 Teaser Post for Social Exchange Launch

### Caption (AI-Generated Style)
```
🚀 Something big is coming...

Imagine managing ALL your social media from one tactical command center.

No more switching apps.
No more missed posts.
No more guessing games.

SOCIAL EXCHANGE is your new mission control 🎮

• Connect all platforms in one place
• AI-powered content generation
• Smart scheduling & automation
• Real-time analytics dashboard
• Marketplace for account trading

The future of social media management isn't an app.
It's a command center.

🔗 Coming soon. Stay tuned.

#SocialExchange #SocialMediaManagement #ContentCreator #InfluencerTools #SocialMediaAutomation #MarketingTech #CreatorEconomy #DigitalMarketing #AI #TechStartup #ComingSoon #BetaLaunch
```

### Visual Suggestion
- Dark, sleek UI screenshot
- Or: Cockpit interface with stats visible
- Or: Animation GIF of the entrance experience

---

## 🔧 Troubleshooting

### Instagram OAuth Issues
- Ensure your app is in Live mode (not Development)
- Verify redirect URI matches: `https://your-tunnel-url/api/auth/callback/instagram-direct`
- Check that your Instagram account is Business or Creator

### Audio Not Playing
- Browser requires user interaction first
- Tap anywhere on the page before audio starts

### Mobile Layout Issues
- Clear browser cache
- Ensure viewport meta tag is present
- Check for horizontal scroll

### Copilot Not Generating
- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API key has credits
- Look at browser console for errors

---

## 📊 Demo Talking Points

1. **The Experience**: "Notice how this doesn't feel like a typical dashboard - it feels like a mission control center"

2. **Audio & Atmosphere**: "The ambient audio changes based on where you are - it's immersive"

3. **AI Integration**: "The Copilot isn't just a chatbot - it's a marketing strategist that knows social media"

4. **Automation**: "Set it and forget it - or keep full manual control. Your choice."

5. **Mobile-First**: "This works perfectly on your phone - manage your social media from anywhere"

6. **The Market**: "Eventually, you can even trade accounts or shares in the marketplace"

---

## 🎬 Screen Recording Tips

1. **Audio**: Make sure to capture the ambient soundscape
2. **Mobile**: Use iOS screen recording for authentic feel
3. **Transitions**: Show the warp-speed entrance
4. **AI Demo**: Record the Copilot generating real content
5. **Speed**: Keep clips 15-30 seconds for social

Good luck with your demo! 🚀
