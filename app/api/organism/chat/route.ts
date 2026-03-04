import { NextResponse } from 'next/server';
import {
  isQwenConfigured,
  chatCompletion,
  buildOrganismSystemPrompt,
  getLocalFallbackResponse,
} from '@/app/cockpit/my-e-assets/my-e-storage/organism/lib/qwen-client';
import { checkRateLimit } from '../rate-limit';

// ============================================
// POST /api/organism/chat
// Chat with SYN organism
// ============================================

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateCheck = checkRateLimit('chat', clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again shortly.' },
        { status: 429 }
      );
    }

    let message: string;
    let context: Record<string, unknown> | undefined;
    let history: Array<{role: string; content: string}> | undefined;
    try {
      const body = await req.json();
      message = body.message;
      context = body.context;
      history = body.history;
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

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

        // Build messages with conversation history
        const messages: Array<{role: 'system' | 'user' | 'assistant'; content: string}> = [];

        // Include last 10 messages of history for context
        if (history && history.length > 0) {
          const recentHistory = history.slice(-10);
          for (const msg of recentHistory) {
            messages.push({
              role: msg.role === 'organism' ? 'assistant' : (msg.role as 'user' | 'assistant'),
              content: msg.content,
            });
          }
        }

        // Add current message
        messages.push({ role: 'user', content: message });

        const reply = await chatCompletion(systemPrompt, messages);

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
