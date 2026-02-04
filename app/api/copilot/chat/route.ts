import { NextRequest, NextResponse } from 'next/server';

// Using direct fetch to Anthropic API

const SYSTEM_PROMPT = `You are an expert social media strategist and content coach for Instagram. Your name is "Social Exchange Copilot". You help creators grow their accounts, write engaging content, and develop winning strategies.

Your expertise includes:
- Writing viral captions that drive engagement
- Hashtag strategy and optimization
- Content planning and scheduling
- Audience growth tactics
- Instagram algorithm insights
- Reels and Stories best practices
- Community engagement strategies
- Brand voice development

When helping users:
- Be concise but actionable
- Give specific examples when possible
- Use emojis sparingly to match the social media context
- Focus on practical, implementable advice
- Consider the user's current follower count and engagement when giving advice

Always be encouraging and supportive while providing honest, data-driven insights.`;

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
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

    // Build context about the user's account
    let userContext = '';
    if (context) {
      userContext = `\n\nUser's Instagram account context:
- Handle: ${context.handle || 'Unknown'}
- Followers: ${context.followers?.toLocaleString() || 'Unknown'}
- Following: ${context.following?.toLocaleString() || 'Unknown'}
- Posts: ${context.totalPosts || 'Unknown'}
- Engagement Rate: ${context.engagement ? context.engagement.toFixed(1) + '%' : 'Unknown'}`;
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
        max_tokens: 1024,
        system: SYSTEM_PROMPT + userContext,
        messages: [
          {
            role: 'user',
            content: message,
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
        { error: data.error?.message || 'Failed to get AI response' },
        { status: response.status }
      );
    }

    // Extract the text response
    const textContent = data.content?.find((block: any) => block.type === 'text');
    const reply = textContent ? textContent.text : 'I apologize, but I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Copilot chat error:', error);

    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
