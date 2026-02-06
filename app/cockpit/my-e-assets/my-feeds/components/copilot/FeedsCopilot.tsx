'use client';

import { useState, useRef, useEffect } from 'react';
import { Feed, Platform, PLATFORMS } from '../../types/feed';
import './copilot.css';

// ============================================
// TYPES
// ============================================

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: CopilotAction[];
  context?: ConversationContext;
}

interface CopilotAction {
  id: string;
  label: string;
  type: 'navigate' | 'action' | 'link' | 'automate';
  payload?: unknown;
}

interface ConversationContext {
  topic?: string;
  subTopic?: string;
  mentions?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface QuickPrompt {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  category: 'automation' | 'content' | 'analytics' | 'help' | 'strategy' | 'growth';
}

interface BrandProfile {
  niche?: string;
  targetAudience?: string;
  contentPillars?: string[];
  brandVoice?: string;
  goals?: string[];
  competitors?: string[];
}

// ============================================
// CONVERSATION MEMORY & CONTEXT
// ============================================

interface ConversationMemory {
  brandProfile: BrandProfile;
  previousTopics: string[];
  userPreferences: Record<string, string>;
  automationSettings: {
    preferredPostTimes?: string[];
    hashtagStrategy?: string;
    contentMix?: Record<string, number>;
  };
}

const defaultMemory: ConversationMemory = {
  brandProfile: {},
  previousTopics: [],
  userPreferences: {},
  automationSettings: {},
};

// ============================================
// QUICK PROMPTS - EXPANDED
// ============================================

const QUICK_PROMPTS: QuickPrompt[] = [
  // Strategy
  {
    id: 'brand-strategy',
    icon: '🎯',
    label: 'Brand Strategy',
    prompt: 'Help me develop a brand strategy for my social media presence',
    category: 'strategy',
  },
  {
    id: 'content-pillars',
    icon: '📚',
    label: 'Content Pillars',
    prompt: 'What content pillars should I focus on for my niche?',
    category: 'strategy',
  },
  // Growth
  {
    id: 'growth-plan',
    icon: '📈',
    label: 'Growth Plan',
    prompt: 'Create a 30-day growth plan for my account',
    category: 'growth',
  },
  {
    id: 'hashtag-strategy',
    icon: '#️⃣',
    label: 'Hashtag Strategy',
    prompt: 'What hashtag strategy should I use for maximum reach?',
    category: 'growth',
  },
  // Automation
  {
    id: 'enable-autopilot',
    icon: '🤖',
    label: 'Enable Autopilot',
    prompt: 'Help me set up full automation for my account',
    category: 'automation',
  },
  {
    id: 'posting-schedule',
    icon: '📅',
    label: 'Posting Schedule',
    prompt: 'What posting schedule will maximize my engagement?',
    category: 'automation',
  },
  // Content
  {
    id: 'content-ideas',
    icon: '💡',
    label: 'Content Ideas',
    prompt: 'Give me 10 content ideas for this week',
    category: 'content',
  },
  {
    id: 'caption-help',
    icon: '✍️',
    label: 'Caption Writing',
    prompt: 'Help me write engaging captions for my posts',
    category: 'content',
  },
  // Analytics
  {
    id: 'analyze-performance',
    icon: '📊',
    label: 'Analyze Performance',
    prompt: 'Analyze my account performance and give me recommendations',
    category: 'analytics',
  },
  {
    id: 'competitor-analysis',
    icon: '🔍',
    label: 'Competitor Analysis',
    prompt: 'How do I analyze and learn from my competitors?',
    category: 'analytics',
  },
];

// ============================================
// MARKETING KNOWLEDGE BASE
// ============================================

const MARKETING_KNOWLEDGE = {
  contentPillars: {
    lifestyle: ['Daily routines', 'Personal stories', 'Behind the scenes', 'Product recommendations', 'Lifestyle tips'],
    fitness: ['Workout tutorials', 'Nutrition tips', 'Progress updates', 'Motivation', 'Equipment reviews'],
    business: ['Industry insights', 'Case studies', 'Tips & tutorials', 'Behind the scenes', 'Success stories'],
    fashion: ['Outfit inspiration', 'Styling tips', 'Trend alerts', 'Hauls', 'Brand partnerships'],
    tech: ['Reviews', 'Tutorials', 'News & updates', 'Comparisons', 'Tips & tricks'],
    food: ['Recipes', 'Restaurant reviews', 'Cooking tips', 'Food photography', 'Ingredient spotlights'],
    travel: ['Destination guides', 'Travel tips', 'Itineraries', 'Budget advice', 'Cultural insights'],
  },

  hashtagStrategies: {
    small: 'Mix of 10-15 hashtags: 5 niche-specific (10K-100K posts), 5 medium (100K-500K posts), 3-5 broad (500K+)',
    medium: 'Mix of 15-25 hashtags: Focus more on medium-sized hashtags where you can compete',
    large: 'Mix of 20-30 hashtags: Can include larger hashtags, branded hashtags become important',
  },

  postingTimes: {
    instagram: { weekday: ['7-9 AM', '12-2 PM', '7-9 PM'], weekend: ['10 AM-12 PM', '7-9 PM'] },
    tiktok: { weekday: ['7-9 AM', '12-3 PM', '7-11 PM'], weekend: ['9 AM-12 PM', '7-11 PM'] },
    twitter: { weekday: ['8-10 AM', '12-1 PM', '5-6 PM'], weekend: ['9-11 AM'] },
    youtube: { weekday: ['12-4 PM', '7-9 PM'], weekend: ['9 AM-12 PM'] },
    linkedin: { weekday: ['7-8 AM', '12 PM', '5-6 PM'], weekend: ['N/A - Focus on weekdays'] },
  },

  engagementTips: [
    'Respond to every comment within the first hour',
    'Ask questions in your captions to encourage comments',
    'Use polls and interactive stickers in Stories',
    'Go live regularly to boost algorithm favor',
    'Engage with 10-20 accounts in your niche daily',
    'Post when your audience is most active',
    'Create saveable content (tips, tutorials, guides)',
    'Use carousel posts for higher engagement rates',
  ],

  growthStrategies: {
    organic: [
      'Consistency: Post at least once daily',
      'Quality: Invest in good lighting and editing',
      'Engagement: Spend 30 min/day engaging with others',
      'Collaboration: Partner with similar-sized creators',
      'Trends: Jump on relevant trends quickly',
      'SEO: Optimize bio, captions, and hashtags',
    ],
    paid: [
      'Start with small budgets ($5-10/day) to test',
      'Target lookalike audiences of your followers',
      'Boost your best-performing organic content',
      'Use retargeting for warm audiences',
      'A/B test different creatives and copy',
    ],
  },

  brandVoices: {
    professional: 'Formal, authoritative, educational, data-driven',
    casual: 'Friendly, conversational, relatable, approachable',
    inspirational: 'Motivating, uplifting, empowering, positive',
    humorous: 'Witty, playful, entertaining, meme-worthy',
    luxury: 'Sophisticated, exclusive, refined, aspirational',
  },
};

// ============================================
// AI RESPONSE ENGINE
// ============================================

const analyzeInput = (input: string): ConversationContext => {
  const lowerInput = input.toLowerCase();

  let topic = 'general';
  let subTopic = '';

  // Detect main topic
  if (lowerInput.includes('brand') || lowerInput.includes('strategy') || lowerInput.includes('positioning')) {
    topic = 'branding';
  } else if (lowerInput.includes('grow') || lowerInput.includes('follower') || lowerInput.includes('reach')) {
    topic = 'growth';
  } else if (lowerInput.includes('content') || lowerInput.includes('post') || lowerInput.includes('idea')) {
    topic = 'content';
  } else if (lowerInput.includes('automat') || lowerInput.includes('schedule') || lowerInput.includes('autopilot')) {
    topic = 'automation';
  } else if (lowerInput.includes('engag') || lowerInput.includes('like') || lowerInput.includes('comment')) {
    topic = 'engagement';
  } else if (lowerInput.includes('hashtag') || lowerInput.includes('tag')) {
    topic = 'hashtags';
  } else if (lowerInput.includes('analyt') || lowerInput.includes('metric') || lowerInput.includes('perform')) {
    topic = 'analytics';
  } else if (lowerInput.includes('compet') || lowerInput.includes('rival')) {
    topic = 'competition';
  } else if (lowerInput.includes('caption') || lowerInput.includes('write') || lowerInput.includes('copy')) {
    topic = 'copywriting';
  } else if (lowerInput.includes('monetiz') || lowerInput.includes('money') || lowerInput.includes('revenue') || lowerInput.includes('sponsor')) {
    topic = 'monetization';
  }

  return { topic, subTopic };
};

const getAIResponse = (
  input: string,
  feeds: Feed[],
  memory: ConversationMemory,
  messageHistory: Message[]
): { content: string; actions?: CopilotAction[]; updatedMemory?: Partial<ConversationMemory> } => {
  const lowerInput = input.toLowerCase();
  const context = analyzeInput(input);

  // Get conversation context from recent messages
  const recentTopics = messageHistory.slice(-5).map(m => m.context?.topic).filter(Boolean);

  // ========== BRAND STRATEGY ==========
  if (context.topic === 'branding' || lowerInput.includes('brand strategy')) {
    if (lowerInput.includes('develop') || lowerInput.includes('create') || lowerInput.includes('help me')) {
      return {
        content: `Let's build your brand strategy together! 🎯\n\n**Step 1: Define Your Niche**\nWhat specific area do you focus on? The more specific, the better for growth.\n\n**Step 2: Know Your Audience**\nWho exactly are you trying to reach? Age, interests, problems they face?\n\n**Step 3: Establish Your Brand Voice**\nHow do you want to sound? Options include:\n• **Professional** - ${MARKETING_KNOWLEDGE.brandVoices.professional}\n• **Casual** - ${MARKETING_KNOWLEDGE.brandVoices.casual}\n• **Inspirational** - ${MARKETING_KNOWLEDGE.brandVoices.inspirational}\n• **Humorous** - ${MARKETING_KNOWLEDGE.brandVoices.humorous}\n\n**Step 4: Create Content Pillars**\nPick 3-5 core topics you'll consistently post about.\n\nTell me about your niche and I'll give you personalized recommendations!`,
        actions: [
          { id: 'set-niche', label: 'Help Me Pick a Niche', type: 'action', payload: 'niche-selection' },
          { id: 'voice-quiz', label: 'Brand Voice Quiz', type: 'action', payload: 'voice-quiz' },
        ],
      };
    }
  }

  // ========== CONTENT PILLARS ==========
  if (lowerInput.includes('content pillar') || (context.topic === 'content' && lowerInput.includes('pillar'))) {
    const niches = Object.keys(MARKETING_KNOWLEDGE.contentPillars);
    const detectedNiche = niches.find(n => lowerInput.includes(n)) || memory.brandProfile.niche;

    if (detectedNiche && MARKETING_KNOWLEDGE.contentPillars[detectedNiche as keyof typeof MARKETING_KNOWLEDGE.contentPillars]) {
      const pillars = MARKETING_KNOWLEDGE.contentPillars[detectedNiche as keyof typeof MARKETING_KNOWLEDGE.contentPillars];
      return {
        content: `**Content Pillars for ${detectedNiche.charAt(0).toUpperCase() + detectedNiche.slice(1)}** 📚\n\nHere are 5 proven content pillars for your niche:\n\n${pillars.map((p, i) => `${i + 1}. **${p}** - Creates ${['connection', 'value', 'trust', 'engagement', 'authority'][i]} with your audience`).join('\n')}\n\n**Pro Tip:** Aim for a content mix of:\n• 40% Educational/Value content\n• 30% Entertainment/Engaging content\n• 20% Community/Personal content\n• 10% Promotional content\n\nWant me to generate specific post ideas for any of these pillars?`,
        actions: [
          { id: 'gen-ideas', label: 'Generate Post Ideas', type: 'action', payload: 'content-ideas' },
          { id: 'content-calendar', label: 'Create Content Calendar', type: 'navigate', payload: 'scheduler' },
        ],
        updatedMemory: {
          brandProfile: { ...memory.brandProfile, niche: detectedNiche, contentPillars: pillars },
        },
      };
    }

    return {
      content: `**Content Pillars** are the 3-5 core topics you consistently create content around. They help you:\n\n✅ Stay focused and consistent\n✅ Become known for specific topics\n✅ Never run out of ideas\n✅ Build authority in your niche\n\nWhat niche are you in? I can suggest tailored content pillars for:\n• Lifestyle\n• Fitness\n• Business\n• Fashion\n• Tech\n• Food\n• Travel\n\nOr tell me about your unique niche!`,
    };
  }

  // ========== GROWTH PLAN ==========
  if (context.topic === 'growth' || lowerInput.includes('growth plan') || lowerInput.includes('grow my')) {
    const followerCount = feeds.reduce((sum, f) => sum + (f.metrics.followers || 0), 0);
    const accountSize = followerCount < 1000 ? 'small' : followerCount < 10000 ? 'medium' : 'large';

    return {
      content: `**Your 30-Day Growth Plan** 📈\n\nBased on your ${feeds.length} connected account(s) with ~${followerCount.toLocaleString()} total followers:\n\n**Week 1: Foundation**\n• Audit your profile (bio, highlights, grid aesthetic)\n• Research 5 competitors and note what works\n• Define your content pillars (3-5 topics)\n• Set up your content calendar\n\n**Week 2: Consistency**\n• Post 1-2x daily at optimal times\n• Engage 30 min/day in your niche\n• Test different content formats\n• Start tracking what performs best\n\n**Week 3: Expansion**\n• Collaborate with 2-3 similar creators\n• Go live at least once\n• Repurpose your best content\n• Engage with larger accounts' comments\n\n**Week 4: Optimization**\n• Double down on top-performing content types\n• Refine hashtag strategy based on data\n• Consider a small paid boost ($5-10/day)\n• Plan next month based on learnings\n\n**Daily Actions:**\n• 1-2 feed posts\n• 5-10 stories\n• 30 min engagement\n• Reply to all comments within 1 hour`,
      actions: [
        { id: 'automate-plan', label: 'Automate This Plan', type: 'automate', payload: 'growth-30-day' },
        { id: 'schedule-content', label: 'Start Scheduling', type: 'navigate', payload: 'scheduler' },
      ],
    };
  }

  // ========== HASHTAG STRATEGY ==========
  if (context.topic === 'hashtags' || lowerInput.includes('hashtag')) {
    const followerCount = feeds.reduce((sum, f) => sum + (f.metrics.followers || 0), 0);
    const strategy = followerCount < 10000 ? 'small' : followerCount < 100000 ? 'medium' : 'large';

    return {
      content: `**Hashtag Strategy for Your Account** #️⃣\n\nWith ~${followerCount.toLocaleString()} followers, here's your optimal approach:\n\n**${MARKETING_KNOWLEDGE.hashtagStrategies[strategy]}**\n\n**Best Practices:**\n• Research hashtags weekly - trends change!\n• Create 3-5 hashtag sets for different content types\n• Mix sizes: some you can rank in, some for discovery\n• Hide hashtags in first comment for cleaner captions\n• Track which hashtags drive the most reach\n\n**Hashtag Categories to Use:**\n1. **Niche-specific** (your exact topic)\n2. **Industry** (broader category)\n3. **Community** (target audience)\n4. **Location** (if relevant)\n5. **Branded** (your unique hashtag)\n\n**Avoid:**\n❌ Banned or flagged hashtags\n❌ Super competitive hashtags (1M+ posts)\n❌ Irrelevant/spammy hashtags\n❌ Using the exact same set every time\n\nWant me to suggest specific hashtags for your niche?`,
      actions: [
        { id: 'hashtag-research', label: 'Research Hashtags', type: 'action', payload: 'hashtag-tool' },
        { id: 'save-strategy', label: 'Save This Strategy', type: 'action', payload: 'save-hashtag-strategy' },
      ],
    };
  }

  // ========== POSTING SCHEDULE ==========
  if (lowerInput.includes('schedule') || lowerInput.includes('when to post') || lowerInput.includes('best time')) {
    const platforms = feeds.map(f => f.platform);
    const uniquePlatforms = Array.from(new Set(platforms));

    let scheduleContent = `**Optimal Posting Schedule** ⏰\n\nBased on your connected platforms:\n\n`;

    uniquePlatforms.forEach(platform => {
      const times = MARKETING_KNOWLEDGE.postingTimes[platform as keyof typeof MARKETING_KNOWLEDGE.postingTimes];
      if (times) {
        scheduleContent += `**${PLATFORMS[platform].icon} ${PLATFORMS[platform].label}:**\n`;
        scheduleContent += `• Weekdays: ${times.weekday.join(', ')}\n`;
        scheduleContent += `• Weekends: ${times.weekend.join(', ')}\n\n`;
      }
    });

    scheduleContent += `**Pro Tips:**\n• Test these times for 2 weeks, then check your analytics\n• Your specific audience might differ from averages\n• Consistency matters more than perfect timing\n• Use our Autopilot to post at these times automatically!`;

    return {
      content: scheduleContent,
      actions: [
        { id: 'enable-auto', label: 'Enable Auto-Scheduling', type: 'automate', payload: 'auto-schedule' },
        { id: 'go-scheduler', label: 'Open Scheduler', type: 'navigate', payload: 'scheduler' },
      ],
    };
  }

  // ========== AUTOMATION SETUP ==========
  if (context.topic === 'automation' || lowerInput.includes('automat') || lowerInput.includes('autopilot')) {
    const automatedCount = feeds.filter(f => f.automationEnabled).length;

    if (lowerInput.includes('set up') || lowerInput.includes('enable') || lowerInput.includes('help me')) {
      return {
        content: `**Let's Set Up Full Automation** 🤖\n\nI can help you automate your entire social media workflow!\n\n**What We Can Automate:**\n\n✅ **Content Scheduling**\n• Queue posts days/weeks in advance\n• Auto-post at optimal times\n• Cross-post to multiple platforms\n\n✅ **Engagement (Coming Soon)**\n• Auto-respond to common DMs\n• Like/comment on hashtag feeds\n• Follow-back qualified accounts\n\n✅ **Analytics**\n• Weekly performance reports\n• Growth tracking\n• Content performance alerts\n\n**Current Status:**\n• ${feeds.length} connected account(s)\n• ${automatedCount} in autopilot mode\n• ${feeds.length - automatedCount} in manual mode\n\n**Recommended Setup:**\n1. Set content pillars\n2. Create content queue (2 weeks ahead)\n3. Enable autopilot mode\n4. Review analytics weekly\n\nShall I walk you through each step?`,
        actions: [
          { id: 'start-automation', label: 'Start Automation Wizard', type: 'action', payload: 'automation-wizard' },
          { id: 'go-workspace', label: 'Go to Workspace', type: 'navigate', payload: 'workspace' },
        ],
      };
    }

    return {
      content: `**Autopilot Mode** lets Social Exchange manage your posting automatically.\n\n**Control Modes Explained:**\n\n🤖 **Autopilot**: Full automation. Posts go live at scheduled times without approval.\n\n🔒 **Escrow**: Semi-automated. Content queues but needs your approval before posting.\n\n✋ **Manual**: No automation. You control when each post goes live.\n\n👁️ **Observation**: Read-only. Monitor accounts without posting.\n\nCurrently, you have **${automatedCount}** account${automatedCount !== 1 ? 's' : ''} in autopilot mode.\n\nWant to change the mode for any account?`,
      actions: [
        { id: 'go-workspace', label: 'Manage Control Modes', type: 'navigate', payload: 'workspace' },
      ],
    };
  }

  // ========== CONTENT IDEAS ==========
  if (context.topic === 'content' && (lowerInput.includes('idea') || lowerInput.includes('what to post'))) {
    const niche = memory.brandProfile.niche || 'general';
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return {
      content: `**Content Ideas for This Week** 💡\n\nHere are 10 ideas to keep your feed fresh:\n\n**Educational (High Value):**\n1. "5 mistakes beginners make in [your niche]"\n2. Step-by-step tutorial on a common task\n3. "What I wish I knew when I started"\n\n**Engaging (High Comments):**\n4. "This or That" poll in Stories\n5. "Unpopular opinion about [topic]"\n6. Ask your audience for advice on something\n\n**Personal (High Connection):**\n7. Behind-the-scenes of your process\n8. A day in your life\n9. Share a failure and what you learned\n\n**Trending:**\n10. Put your spin on a current trend/meme\n\n**${dayOfWeek} Specific Ideas:**\n• Motivation Monday: Share an inspiring quote or story\n• Tuesday Tips: Quick actionable advice\n• Wednesday Wins: Celebrate a recent achievement\n• Throwback Thursday: Share your journey\n• Friday Feels: Something light and fun\n• Saturday Stories: Q&A or AMA\n• Sunday Reset: Planning or self-care content\n\nNeed more specific ideas for your niche?`,
      actions: [
        { id: 'more-ideas', label: 'Generate More Ideas', type: 'action', payload: 'more-content-ideas' },
        { id: 'schedule-idea', label: 'Schedule These Ideas', type: 'navigate', payload: 'scheduler' },
      ],
    };
  }

  // ========== CAPTION WRITING ==========
  if (context.topic === 'copywriting' || lowerInput.includes('caption') || lowerInput.includes('write')) {
    return {
      content: `**Caption Writing Formula** ✍️\n\n**The AIDA Framework:**\n\n**A - Attention (Hook)**\nStart with something that stops the scroll:\n• Bold statement\n• Intriguing question\n• Controversial opinion\n• Relatable problem\n\n**I - Interest (Story/Value)**\nKeep them reading with:\n• Personal story\n• Useful information\n• Behind-the-scenes insight\n• Data or facts\n\n**D - Desire (Benefits)**\nShow what's in it for them:\n• How this helps them\n• What they'll learn\n• The transformation possible\n\n**A - Action (CTA)**\nTell them what to do:\n• "Save this for later"\n• "Comment [word] if you agree"\n• "Share with someone who needs this"\n• "Link in bio"\n\n**Pro Tips:**\n• First 125 characters are crucial (shown before "more")\n• Use line breaks for readability\n• Emojis can increase engagement by 48%\n• Questions get 2x more comments\n\nWant me to help write a caption for a specific post?`,
      actions: [
        { id: 'write-caption', label: 'Help Write a Caption', type: 'action', payload: 'caption-writer' },
        { id: 'caption-templates', label: 'Caption Templates', type: 'action', payload: 'templates' },
      ],
    };
  }

  // ========== ENGAGEMENT TIPS ==========
  if (context.topic === 'engagement') {
    const avgEngagement = feeds.length > 0
      ? (feeds.reduce((sum, f) => sum + (f.metrics.engagement || 0), 0) / feeds.length).toFixed(2)
      : '0';

    return {
      content: `**Boost Your Engagement** 💬\n\nYour current average engagement: **${avgEngagement}%**\n${parseFloat(avgEngagement) < 2 ? '(Below average - let\'s improve this!)' : parseFloat(avgEngagement) < 5 ? '(Good! Room for improvement)' : '(Excellent! Keep it up!)'}\n\n**Top Engagement Strategies:**\n\n${MARKETING_KNOWLEDGE.engagementTips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}\n\n**Quick Wins:**\n• Add a question to your next 5 captions\n• Respond to comments with questions (sparks conversations)\n• Post a controversial but safe opinion\n• Create a "Save this" infographic\n• Go live for just 10 minutes\n\n**Engagement Pods:**\nConsider joining engagement groups in your niche where creators support each other's content (use carefully - authenticity matters!)`,
      actions: [
        { id: 'engagement-checklist', label: 'Daily Engagement Checklist', type: 'action', payload: 'engagement-checklist' },
        { id: 'analyze-content', label: 'Analyze My Content', type: 'action', payload: 'content-analysis' },
      ],
    };
  }

  // ========== COMPETITOR ANALYSIS ==========
  if (context.topic === 'competition' || lowerInput.includes('competitor')) {
    return {
      content: `**Competitor Analysis Framework** 🔍\n\n**Step 1: Identify 5-10 Competitors**\nLook for accounts that:\n• Target the same audience\n• Are slightly larger than you (reachable goals)\n• Post similar content\n• Have good engagement\n\n**Step 2: Analyze Their Content**\n• What content formats do they use?\n• What topics get the most engagement?\n• How often do they post?\n• What's their caption style?\n• What hashtags do they use?\n\n**Step 3: Find the Gaps**\n• What topics don't they cover?\n• What could they do better?\n• What do their followers ask for in comments?\n\n**Step 4: Apply Learnings**\n• Adapt (don't copy) their successful strategies\n• Fill the gaps they're missing\n• Differentiate with your unique angle\n\n**Tools to Use:**\n• Social Exchange Analytics (your dashboard)\n• Check their engagement rates manually\n• Read their comments for feedback\n• Note their posting times\n\n**Track These Metrics:**\n• Follower growth rate\n• Engagement rate\n• Post frequency\n• Content themes\n• Brand partnerships`,
      actions: [
        { id: 'add-competitor', label: 'Track a Competitor', type: 'action', payload: 'add-competitor' },
        { id: 'competitor-report', label: 'Generate Comparison', type: 'action', payload: 'competitor-report' },
      ],
    };
  }

  // ========== MONETIZATION ==========
  if (context.topic === 'monetization') {
    const followerCount = feeds.reduce((sum, f) => sum + (f.metrics.followers || 0), 0);

    return {
      content: `**Monetization Strategies** 💰\n\nWith ~${followerCount.toLocaleString()} followers, here are your options:\n\n**${followerCount < 5000 ? 'Starting Out (Under 5K):' : followerCount < 25000 ? 'Growing (5K-25K):' : followerCount < 100000 ? 'Established (25K-100K):' : 'Influencer (100K+):'}**\n\n${followerCount < 5000 ? `• **Affiliate Marketing** - Promote products you use (Amazon Associates, etc.)\n• **Digital Products** - Sell ebooks, presets, templates\n• **Services** - Coaching, consulting, freelancing\n• **Tips/Donations** - If you provide value (Ko-fi, Buy Me a Coffee)` : followerCount < 25000 ? `• **Brand Collaborations** - Start reaching out to small brands\n• **Affiliate Marketing** - Build relationships with favorite brands\n• **Digital Products** - Courses, guides, templates\n• **Sponsored Posts** - $100-500 per post typical` : followerCount < 100000 ? `• **Brand Deals** - $500-2000 per post\n• **Brand Ambassadorships** - Long-term partnerships\n• **Your Own Products** - Merch, courses, membership\n• **Platform Bonuses** - Reels Bonus, Creator Fund` : `• **Major Brand Deals** - $2000+ per post\n• **Long-term Partnerships** - $10K+ monthly retainers\n• **Your Own Brand** - Launch products/services\n• **Licensing** - Content licensing deals`}\n\n**Next Steps:**\n1. Create a media kit\n2. Set your rates\n3. Reach out to brands you love\n4. Join creator marketplaces\n\n**On Social Exchange:**\nYou can also sell your account on our marketplace when you're ready to cash out!`,
      actions: [
        { id: 'media-kit', label: 'Create Media Kit', type: 'action', payload: 'media-kit' },
        { id: 'marketplace', label: 'View Marketplace', type: 'navigate', payload: '/cockpit/my-e-assets/market' },
      ],
    };
  }

  // ========== ANALYTICS EXPLANATION ==========
  if (context.topic === 'analytics' || lowerInput.includes('metric') || lowerInput.includes('analytic')) {
    return {
      content: `**Understanding Your Analytics** 📊\n\n**Key Metrics Explained:**\n\n**Engagement Rate**\n(Likes + Comments + Saves + Shares) / Followers × 100\n• 1-3%: Average\n• 3-6%: Good\n• 6%+: Excellent\n\n**Reach vs Impressions**\n• **Reach**: Unique accounts that saw your content\n• **Impressions**: Total times content was displayed\n• Impressions > Reach means people viewed multiple times (good!)\n\n**Follower Growth Rate**\n(New Followers - Lost Followers) / Total Followers × 100\n• Healthy: 1-3% per month\n• Viral content can spike this temporarily\n\n**Save Rate**\nSaves / Reach × 100\n• High saves = valuable content\n• Signals to algorithm: this is worth showing\n\n**Share Rate**\nShares / Reach × 100\n• Most valuable action\n• Dramatically increases organic reach\n\n**What to Track Weekly:**\n• Top performing post (and why)\n• Worst performing post (and why)\n• Follower growth/loss\n• Engagement rate trend\n• Best performing content type`,
      actions: [
        { id: 'view-analytics', label: 'View My Analytics', type: 'navigate', payload: 'workspace' },
        { id: 'export-report', label: 'Export Report', type: 'action', payload: 'export-analytics' },
      ],
    };
  }

  // ========== HELP / CAPABILITIES ==========
  if (lowerInput.includes('help') || lowerInput.includes('what can you do') || lowerInput.includes('capabilities')) {
    return {
      content: `**I'm your Marketing Strategy Copilot!** 🤖\n\nI can help you with:\n\n**🎯 Brand Strategy**\n• Define your niche and positioning\n• Create content pillars\n• Develop your brand voice\n• Analyze competitors\n\n**📈 Growth**\n• 30-day growth plans\n• Hashtag strategies\n• Engagement tactics\n• Collaboration opportunities\n\n**📝 Content**\n• Content ideas and calendars\n• Caption writing formulas\n• Trend identification\n• Content optimization\n\n**🤖 Automation**\n• Set up autopilot posting\n• Create posting schedules\n• Optimize timing\n• Workflow automation\n\n**📊 Analytics**\n• Performance analysis\n• Metric explanations\n• Benchmarking\n• Recommendations\n\n**💰 Monetization**\n• Revenue strategies\n• Brand deal guidance\n• Media kit creation\n• Rate setting\n\nJust ask me anything! The more context you give me, the better I can help. Try: "Help me create a 30-day growth plan for my fitness account"`,
    };
  }

  // ========== GREETING / SMALL TALK ==========
  if (lowerInput.match(/^(hi|hello|hey|sup|yo|what's up)/i)) {
    const timeOfDay = new Date().getHours();
    const greeting = timeOfDay < 12 ? 'Good morning' : timeOfDay < 18 ? 'Good afternoon' : 'Good evening';

    return {
      content: `${greeting}! 👋 Great to see you!\n\nI'm here to help you grow your social media presence. Here are some things we could work on:\n\n• **Strategy**: Define your brand and content pillars\n• **Growth**: Create a plan to gain more followers\n• **Content**: Get ideas and optimize your posts\n• **Automation**: Set up hands-free posting\n\nWhat would you like to focus on today?`,
    };
  }

  // ========== DEFAULT RESPONSE ==========
  return {
    content: `I'd be happy to help with "${input.slice(0, 60)}${input.length > 60 ? '...' : ''}"\n\nTo give you the best advice, could you tell me more about:\n\n• **Your niche/industry**: What do you post about?\n• **Your goals**: More followers? Better engagement? Monetization?\n• **Your current situation**: How many followers? How often do you post?\n\nOr try one of these topics:\n• "Help me develop a brand strategy"\n• "Create a 30-day growth plan"\n• "What content should I post this week?"\n• "Set up automation for my accounts"`,
    actions: [
      { id: 'brand-strategy', label: 'Brand Strategy', type: 'action', payload: 'brand-strategy' },
      { id: 'growth-plan', label: 'Growth Plan', type: 'action', payload: 'growth-plan' },
      { id: 'content-ideas', label: 'Content Ideas', type: 'action', payload: 'content-ideas' },
    ],
  };
};

// ============================================
// COMPONENT
// ============================================

interface FeedsCopilotProps {
  feeds: Feed[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
  onAction?: (action: string, payload?: unknown) => void;
}

export default function FeedsCopilot({
  feeds,
  isOpen,
  onClose,
  onNavigate,
  onAction,
}: FeedsCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! 👋 I'm your Marketing Strategy Copilot. I can help you develop your brand, grow your audience, plan content, and automate your social media workflow. What would you like to work on today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [memory, setMemory] = useState<ConversationMemory>(defaultMemory);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Hide quick prompts after first user message
  useEffect(() => {
    if (messages.filter(m => m.role === 'user').length > 0) {
      setShowQuickPrompts(false);
    }
  }, [messages]);

  // Call Anthropic API with fallback to local pattern matching
  const callFeedsCopilotAPI = async (userInput: string): Promise<{ content: string; actions?: CopilotAction[]; updatedMemory?: Partial<ConversationMemory> }> => {
    // Detect content generation requests for /api/copilot/generate
    const lowerInput = userInput.toLowerCase();
    const isGenerateRequest =
      lowerInput.includes('write a caption') || lowerInput.includes('generate caption') ||
      lowerInput.includes('hashtag') || lowerInput.includes('write bio') ||
      lowerInput.includes('content strategy') || lowerInput.includes('create a strategy');

    const activeFeed = feeds[0]; // Use first feed for context
    const accountContext = activeFeed ? {
      handle: activeFeed.handle,
      followers: activeFeed.metrics?.followers,
      following: activeFeed.metrics?.following,
      totalPosts: activeFeed.metrics?.totalPosts,
      engagement: activeFeed.metrics?.engagementRate,
    } : undefined;

    try {
      if (isGenerateRequest) {
        // Use generate endpoint for content creation
        const type = lowerInput.includes('caption') ? 'caption' :
                     lowerInput.includes('hashtag') ? 'hashtags' :
                     lowerInput.includes('bio') ? 'bio' : 'strategy';

        const response = await fetch('/api/copilot/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            topic: userInput,
            context: accountContext,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          return { content: data.content || 'Could not generate content.' };
        }
      }

      // Use chat endpoint for general conversation
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          context: accountContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return { content: data.reply || 'I apologize, I could not generate a response.' };
      }

      // API error - fall back to local
      console.warn('FeedsCopilot API error, using local fallback');
      return getAIResponse(userInput, feeds, memory, messages);
    } catch (error) {
      console.warn('FeedsCopilot API unavailable, using local fallback:', error);
      return getAIResponse(userInput, feeds, memory, messages);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      context: analyzeInput(input),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsTyping(true);

    const response = await callFeedsCopilotAPI(currentInput);

    // Update memory if response includes updates
    if (response.updatedMemory) {
      setMemory(prev => ({
        ...prev,
        ...response.updatedMemory,
        brandProfile: { ...prev.brandProfile, ...response.updatedMemory?.brandProfile },
      }));
    }

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      actions: response.actions,
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleQuickPrompt = async (prompt: QuickPrompt) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt.prompt,
      timestamp: new Date(),
      context: { topic: prompt.category },
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setShowQuickPrompts(false);
    setIsTyping(true);

    const response = await callFeedsCopilotAPI(prompt.prompt);
    if (response.updatedMemory) {
      setMemory(prev => ({
        ...prev,
        ...response.updatedMemory,
        brandProfile: { ...prev.brandProfile, ...response.updatedMemory?.brandProfile },
      }));
    }
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      actions: response.actions,
    };
    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleAction = (action: CopilotAction) => {
    if (action.type === 'navigate' && onNavigate) {
      onNavigate(action.payload as string);
    } else if ((action.type === 'action' || action.type === 'automate') && onAction) {
      onAction(action.id, action.payload);
    } else if (action.type === 'link') {
      window.open(action.payload as string, '_blank');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const categories = ['strategy', 'growth', 'content', 'automation', 'analytics'];
  const filteredPrompts = selectedCategory
    ? QUICK_PROMPTS.filter(p => p.category === selectedCategory)
    : QUICK_PROMPTS;

  if (!isOpen) return null;

  return (
    <div className="copilot-overlay" onClick={onClose}>
      <div className="copilot-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <header className="copilot-header">
          <div className="copilot-header-left">
            <div className="copilot-avatar">
              <span className="copilot-avatar-icon">🧠</span>
              <span className="copilot-avatar-pulse" />
            </div>
            <div className="copilot-header-info">
              <h2 className="copilot-title">Marketing Copilot</h2>
              <span className="copilot-status">
                <span className="copilot-status-dot" />
                AI Strategy Assistant
              </span>
            </div>
          </div>
          <button className="copilot-close" onClick={onClose}>
            ✕
          </button>
        </header>

        {/* Messages */}
        <div className="copilot-messages">
          {messages.map(message => (
            <div key={message.id} className={`copilot-message ${message.role}`}>
              {message.role === 'assistant' && (
                <div className="copilot-message-avatar">🧠</div>
              )}
              <div className="copilot-message-content">
                <div className="copilot-message-text">
                  {message.content.split('\n').map((line, i) => (
                    <p key={i}>
                      {line.split('**').map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                      )}
                    </p>
                  ))}
                </div>
                {message.actions && message.actions.length > 0 && (
                  <div className="copilot-message-actions">
                    {message.actions.map(action => (
                      <button
                        key={action.id}
                        className={`copilot-action-btn ${action.type === 'automate' ? 'automate' : ''}`}
                        onClick={() => handleAction(action)}
                      >
                        {action.type === 'automate' && '🤖 '}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                <span className="copilot-message-time">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="copilot-message assistant">
              <div className="copilot-message-avatar">🧠</div>
              <div className="copilot-message-content">
                <div className="copilot-typing">
                  <span className="copilot-typing-dot" />
                  <span className="copilot-typing-dot" />
                  <span className="copilot-typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {showQuickPrompts && (
          <div className="copilot-quick-prompts">
            <div className="copilot-quick-prompts-header">
              <span className="copilot-quick-prompts-label">Quick Actions</span>
              <div className="copilot-category-tabs">
                <button
                  className={`copilot-category-tab ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`copilot-category-tab ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="copilot-quick-prompts-grid">
              {filteredPrompts.slice(0, 6).map(prompt => (
                <button
                  key={prompt.id}
                  className={`copilot-quick-prompt ${prompt.category}`}
                  onClick={() => handleQuickPrompt(prompt)}
                >
                  <span className="copilot-quick-prompt-icon">{prompt.icon}</span>
                  <span className="copilot-quick-prompt-label">{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="copilot-input-area">
          <textarea
            ref={inputRef}
            className="copilot-input"
            placeholder="Ask me about brand strategy, growth, content ideas, automation..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
            rows={1}
          />
          <button
            className="copilot-send"
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="copilot-footer">
          <span className="copilot-footer-text">
            Powered by Social Exchange AI • Your conversations help improve recommendations
          </span>
        </div>
      </div>
    </div>
  );
}
