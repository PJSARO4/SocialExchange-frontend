import { NextRequest, NextResponse } from 'next/server';

// Using direct fetch to Anthropic API

const GENERATION_PROMPTS = {
  caption: `You are an expert Instagram caption writer. Create an engaging, scroll-stopping caption for the given topic.

Guidelines:
- Start with a strong hook (first line is crucial)
- Use storytelling when appropriate
- Include a clear call-to-action
- Add relevant emojis (but don't overdo it)
- Include 5-10 relevant hashtags at the end
- Keep it between 100-300 words for optimal engagement
- Use line breaks for readability

Return ONLY the caption, no explanations.`,

  hashtags: `You are an Instagram hashtag strategist. Generate a strategic hashtag set for the given topic.

Provide hashtags in three categories:
1. **High Volume (1M+ posts):** 10 popular hashtags for reach
2. **Medium Volume (100K-1M):** 10 moderately competitive hashtags
3. **Niche (10K-100K):** 10 specific hashtags for targeted engagement

Format the output clearly with the categories labeled. Include a brief tip at the end about hashtag usage.`,

  bio: `You are an Instagram bio optimization expert. Create 3 different bio options for the given account.

Each bio should:
- Be under 150 characters
- Include relevant emojis
- Have a clear value proposition
- Include a call-to-action
- Feel authentic and memorable

Format:
**Option 1 - Professional:**
[bio]

**Option 2 - Personal:**
[bio]

**Option 3 - Minimal:**
[bio]`,

  strategy: `You are a social media growth strategist. Create a personalized content strategy based on the account information provided.

Include:
1. **Content Pillars:** 3-4 main content themes
2. **Posting Schedule:** Optimal days and times
3. **Content Mix:** Recommended ratio of content types (Reels, Carousels, Photos, Stories)
4. **Growth Tactics:** 3-5 specific actionable strategies
5. **30-Day Goals:** Realistic targets based on current metrics

Be specific and actionable. Use data and best practices to back up recommendations.`,
};

export async function POST(request: NextRequest) {
  try {
    const { type, topic, context } = await request.json();

    if (!type || !GENERATION_PROMPTS[type as keyof typeof GENERATION_PROMPTS]) {
      return NextResponse.json(
        { error: 'Invalid generation type' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please add your API key to .env.local' },
        { status: 500 }
      );
    }

    const systemPrompt = GENERATION_PROMPTS[type as keyof typeof GENERATION_PROMPTS];

    // Build the user message with context
    let userMessage = '';

    if (type === 'caption') {
      userMessage = `Write an Instagram caption about: ${topic || 'general lifestyle content'}`;
    } else if (type === 'hashtags') {
      userMessage = `Generate strategic hashtags for: ${topic || 'lifestyle content'}`;
    } else if (type === 'bio') {
      userMessage = `Create Instagram bio options for an account with these details:
- Handle: ${context?.handle || '@user'}
- Followers: ${context?.followers?.toLocaleString() || 'growing'}
- Niche/Topic: ${topic || 'lifestyle/personal brand'}`;
    } else if (type === 'strategy') {
      userMessage = `Create a content strategy for this Instagram account:
- Handle: ${context?.handle || '@user'}
- Current Followers: ${context?.followers?.toLocaleString() || 'Unknown'}
- Following: ${context?.following?.toLocaleString() || 'Unknown'}
- Total Posts: ${context?.totalPosts || 'Unknown'}
- Current Engagement Rate: ${context?.engagement ? context.engagement.toFixed(1) + '%' : 'Unknown'}
- Posts per Week: ${context?.postsPerWeek || 'Unknown'}

Focus area: ${topic || 'overall growth'}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);

      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key. Please check your Anthropic API key configuration.' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: data.error?.message || 'Failed to generate content' },
        { status: response.status }
      );
    }

    // Extract the text response
    const textContent = data.content?.find((block: any) => block.type === 'text');
    const content = textContent ? textContent.text : 'Failed to generate content.';

    return NextResponse.json({ content, type });
  } catch (error: any) {
    console.error('Copilot generate error:', error);

    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    );
  }
}
