import { NextResponse } from 'next/server';
import {
  isQwenConfigured,
  chatCompletion,
  buildOrganismSystemPrompt,
  getLocalFallbackResponse,
} from '@/app/cockpit/my-e-assets/my-e-storage/organism/lib/qwen-client';

// ============================================
// POST /api/organism/chat
// Chat with SYN organism
// ============================================

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const {
      totalItems = 0,
      usedPercent = 0,
      recentActivity = '',
      userTraining = '',
    } = context || {};

    // Try Qwen API if configured
    if (isQwenConfigured()) {
      try {
        const systemPrompt = buildOrganismSystemPrompt({
          totalItems,
          usedPercent,
          recentActivity,
          userTraining,
        });

        const reply = await chatCompletion(systemPrompt, [
          { role: 'user', content: message },
        ]);

        // Parse action markers from response
        const suggestedActions: Array<{
          id: string;
          label: string;
          type: string;
          payload?: string;
        }> = [];
        const actionRegex = /\[ACTION:(\w+)(?::([^\]]+))?\]/g;
        let match;
        let cleanReply = reply;

        while ((match = actionRegex.exec(reply)) !== null) {
          const type = match[1];
          const payload = match[2];
          suggestedActions.push({
            id: `action-${suggestedActions.length}`,
            label:
              type === 'compress'
                ? 'Compress'
                : type === 'organize'
                  ? 'Organize'
                  : type === 'scrape'
                    ? `Search: ${payload || 'trending'}`
                    : type === 'tag'
                      ? 'Auto-Tag'
                      : type,
            type,
            payload: payload || undefined,
          });
          cleanReply = cleanReply.replace(match[0], '');
        }

        return NextResponse.json({
          reply: cleanReply.trim(),
          suggestedActions:
            suggestedActions.length > 0 ? suggestedActions : undefined,
        });
      } catch (apiError) {
        console.error('[SYN] Qwen API error, falling back:', apiError);
        // Fall through to fallback
      }
    }

    // Fallback: local pattern-matching
    const fallback = getLocalFallbackResponse(message, {
      totalItems,
      usedPercent,
    });

    return NextResponse.json({
      reply: fallback.content,
      suggestedActions: fallback.actions,
    });
  } catch (err) {
    console.error('[SYN] Chat route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
