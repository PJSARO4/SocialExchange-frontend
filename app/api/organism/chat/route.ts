/**
 * POST /api/organism/chat — SYN chat.
 *
 * SYN-1B: this route now reaches the provider-neutral model layer from SYN-1A
 * instead of the Qwen-specific client.
 *
 * THREE THINGS CHANGED, AND ONLY THESE THREE
 *
 *  1. The model call goes through resolveProvider() -> provider.chat(). There is
 *     NO automatic provider switching: if the explicitly configured provider
 *     fails, that failure is reported.
 *
 *  2. Every response carries provenance. 'model' means a language model wrote
 *     it. 'fallback' means the provider was unavailable. 'deterministic' means
 *     code produced a system status answer. The old behaviour — emitting
 *     pattern-matched text that reads exactly like reasoning — is gone.
 *
 *  3. Model output cannot produce an executable action. See ACTION TOKENS below.
 *
 * qwen-client.ts is intentionally NOT deleted: buildOrganismSystemPrompt and
 * getLocalFallbackResponse are still referenced elsewhere, and removing them is
 * a separate cleanup.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { checkRateLimit } from '../rate-limit';
import { resolveProvider } from '@/app/syn/model/resolve';
import { ProviderError, type ResponseSource, type FallbackReason } from '@/app/syn/model/types';
import { buildSynContext, type SynRequestContext } from '@/app/syn/context/build-syn-context';
import { consumeChatQuota } from '@/app/syn/chat-quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Above the 8s provider timeout so we return a normalized error, not a 504. */
export const maxDuration = 30;

const MAX_HISTORY = 10;
const MAX_MESSAGE_CHARS = 4_000;

interface SynChatResponse {
  reply: string;
  source: ResponseSource;
  provider?: string;
  model?: string;
  reason?: FallbackReason | 'rate_limited' | 'quota_exceeded';
  /**
   * ACTION TOKENS — DELIBERATELY ALWAYS ABSENT FOR MODEL RESPONSES.
   *
   * The old route parsed [ACTION:type:payload] out of model output into
   * suggestedActions, which the UI renders as buttons wired to runTask() —
   * a real execution path (compress, organize, scrape). With a live model that
   * would let generated text summon an executable control.
   *
   * Decision for SYN-1B: action parsing is DISABLED for model responses. Any
   * [ACTION:...] markers are stripped from the text so they neither execute nor
   * leak as raw syntax. This field is retained only for response-shape
   * compatibility and is never populated by this route.
   */
  suggestedActions?: never;
}

/** Strip action markers so they cannot execute and are not shown as syntax. */
function stripActionTokens(text: string): string {
  return text.replace(/\[ACTION:\w+(?::[^\]]+)?\]/g, '').replace(/[ \t]{2,}/g, ' ').trim();
}

const OFFLINE_TEXT =
  'SYN INTELLIGENCE OFFLINE\n\n' +
  'The configured intelligence provider is currently unavailable, so I cannot ' +
  'reason about this right now. I am not going to improvise an answer that ' +
  'looks like analysis.\n\n' +
  'System status and capability information are still accurate and available.';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Existing per-instance limiter. Kept for burst smoothing; it is NOT the
  // spend guardrail (see app/syn/chat-quota.ts for why).
  const clientIp = req.headers.get('x-forwarded-for') || 'anonymous';
  if (!checkRateLimit('chat', clientIp).allowed) {
    return NextResponse.json<SynChatResponse>({
      reply: 'Rate limit reached. Give me a moment before the next message.',
      source: 'deterministic',
      reason: 'rate_limited',
    }, { status: 429 });
  }

  let body: {
    message?: string;
    history?: Array<{ role: string; content: string }>;
    context?: SynRequestContext;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const message = (body.message || '').trim();
  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  // Durable daily ceiling, keyed to the authenticated user.
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (user) {
    const quota = await consumeChatQuota(user.id);
    if (!quota.allowed) {
      return NextResponse.json<SynChatResponse>({
        reply:
          `SYN daily request ceiling reached (${quota.used}/${quota.limit}).\n\n` +
          'This is a development spend guardrail, not a product limit. It resets at 00:00 UTC.',
        source: 'deterministic',
        reason: 'quota_exceeded',
      }, { status: 429 });
    }
  }

  // Explicit provider resolution. No hopping.
  const resolution = resolveProvider();
  if (resolution.status !== 'ok' || !resolution.provider) {
    return NextResponse.json<SynChatResponse>({
      reply: OFFLINE_TEXT,
      source: 'fallback',
      reason: 'provider_not_configured',
    });
  }

  const system = buildSynContext(body.context ?? {}, null);

  const history = (body.history ?? [])
    .slice(-MAX_HISTORY)
    .filter(m => typeof m?.content === 'string' && m.content.trim().length > 0)
    .map(m => ({
      // The organism UI calls the assistant role 'organism'.
      role: (m.role === 'organism' ? 'assistant' : m.role === 'user' ? 'user' : 'assistant') as
        'user' | 'assistant',
      content: m.content,
    }));

  try {
    const result = await resolution.provider.chat({
      system,
      messages: [...history, { role: 'user', content: message }],
      maxTokens: 700,
      temperature: 0.7,
    });

    return NextResponse.json<SynChatResponse>({
      reply: stripActionTokens(result.text) || '(empty response)',
      source: 'model',
      provider: result.provider,
      model: result.model,
    });
  } catch (err) {
    if (err instanceof ProviderError) {
      // detail may echo request metadata — server-side only, never returned.
      if (err.detail) {
        console.error('[SYN chat] provider detail (server-only):', err.detail.slice(0, 300));
      }
      return NextResponse.json<SynChatResponse>({
        reply: OFFLINE_TEXT,
        source: 'fallback',
        reason: err.toFallbackReason(),
      });
    }
    console.error('[SYN chat] unexpected error');
    return NextResponse.json<SynChatResponse>({
      reply: OFFLINE_TEXT,
      source: 'fallback',
      reason: 'provider_error',
    });
  }
}
