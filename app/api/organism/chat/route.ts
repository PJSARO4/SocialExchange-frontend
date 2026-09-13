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
 *
 * SYN-2B FIRST EYES — evidence IN.
 *
 * The client names the asset it believes is selected; the SERVER decides
 * whether that asset belongs to the session user, using SEC-1's
 * resolveOwnedFeed unchanged. Only an ownership-resolved asset can produce
 * evidence, and only an id-free projection of that evidence reaches the model.
 * A non-owned or non-existent asset yields the same empty result, so this
 * endpoint cannot be used to probe another tenant.
 *
 * SYN-3 PRE CHAT TRUST BOUNDARY — history IN.
 *
 * Chat history is client-held (browser localStorage) and posted back on every
 * request, so a modified client can assert arbitrary prior turns — including
 * turns attributed to SYN. That cannot be authenticated here and this milestone
 * does not pretend otherwise. Instead: history is narrowed at the boundary
 * (strict roles, bounded size, credential/identifier redaction) by
 * app/syn/chat/history.ts, and the prompt states explicitly that the record is
 * unauthenticated and confers no authority.
 *
 * SYN-3 PRE also fences operator personalization (userTraining): it is
 * client-held, unverifiable, and was previously interpolated raw into the tail
 * of the system prompt. It is now data inside an explicit untrusted fence.
 *
 * Still true after this milestone: SYN has no hands. No capability is wired to
 * an executor, and nothing here writes anything except the chat quota counter.
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
import { resolveOwnedFeed } from '@/lib/security/tenant';
import { assembleAssetEvidence, unverifiedAssetEvidence } from '@/app/syn/evidence/assemble';
import { renderEvidenceForModel } from '@/app/syn/evidence/render';
import {
  normaliseChatHistory,
  historyWasAltered,
  normalisePersonalization,
  personalizationWasAltered,
  UNTRUSTED_HISTORY_NOTICE,
} from '@/app/syn/chat/history';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
/** Above the 8s provider timeout so we return a normalized error, not a 504. */
export const maxDuration = 30;

// MAX_HISTORY now lives in app/syn/chat/history.ts, with the rest of the
// history trust boundary. One source of truth.
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
    /**
     * userTraining is typed `unknown` on purpose. It is no longer a field of
     * SynRequestContext (see that interface), so it cannot reach the prompt
     * except through normalisePersonalization below.
     */
    context?: SynRequestContext & { userTraining?: unknown };
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

  // ---- SYN-2B: ownership-gated evidence retrieval -------------------------
  //
  // Failure to assemble evidence must never take SYN offline: on any error we
  // fall through with no evidence, and the prompt states the absence honestly.
  let evidenceText: string | null = null;
  const claimedFeedId = body.context?.feed?.feedId;

  if (user && claimedFeedId) {
    try {
      const owned = await resolveOwnedFeed(user.id, claimedFeedId);

      if (!owned) {
        // Unknown and non-owned are deliberately indistinguishable, and no
        // tenant query is issued for either.
        evidenceText = renderEvidenceForModel(
          unverifiedAssetEvidence({
            handle: body.context?.feed?.handle ?? null,
            platform: body.context?.feed?.platform ?? null,
            displayName: body.context?.feed?.displayName ?? null,
          })
        );
      } else {
        // The access token on `owned` is deliberately NOT carried across this
        // boundary: the evidence layer has no field for it.
        const evidence = await assembleAssetEvidence({
          id: owned.id,
          ownerUserId: user.id,
          handle: owned.handle,
          platform: String(owned.platform),
          displayName: owned.displayName,
        });
        evidenceText = renderEvidenceForModel(evidence);
      }
    } catch {
      // Never log the error body: it can contain query detail.
      console.error('[SYN chat] evidence assembly failed; continuing without evidence');
      evidenceText = null;
    }
  }

  // ---- SYN-3 PRE: chat history trust boundary -----------------------------
  //
  // History is client-held (localStorage) and posted back with every request,
  // so every turn — including turns labelled as SYN's own — is untrusted input.
  // normaliseChatHistory narrows what it can carry: strict roles (an unknown or
  // 'system' role is DROPPED, not silently relabelled as an assistant turn),
  // bounded size, and redaction of credential- and identifier-shaped text so
  // material persisted by earlier builds cannot re-enter model context.
  const { messages: history, stats: historyStats } = normaliseChatHistory(body.history);

  if (historyWasAltered(historyStats)) {
    // COUNTS ONLY. The rejected or redacted value is never logged.
    console.warn('[SYN chat] history boundary applied:', JSON.stringify({
      received: historyStats.received,
      accepted: historyStats.accepted,
      dropped: historyStats.dropped,
      budgetDropped: historyStats.budgetDropped,
      truncated: historyStats.truncated,
      redactions: historyStats.redactions,
    }));
  }

  // ---- SYN-3 PRE: operator personalization trust boundary ------------------
  //
  // userTraining is browser-held (localStorage 'sx_organism_config') and was
  // previously interpolated RAW into the tail of the system prompt — a
  // higher-authority position than any chat turn. It is now validated, redacted,
  // bounded and fence-defused here, and rendered inside an explicit untrusted
  // fence by buildSynContext. This is personalization, not configuration, and
  // explicitly NOT the future Operator Constitution: its provenance is
  // unverifiable and its contents must never be migrated automatically.
  const { text: personalization, stats: personalizationStats } =
    normalisePersonalization(body.context?.userTraining);

  if (personalizationWasAltered(personalizationStats)) {
    // COUNTS AND FLAGS ONLY. The personalization text — raw or redacted — is
    // never logged.
    console.warn('[SYN chat] personalization boundary applied:', JSON.stringify({
      present: personalizationStats.present,
      rejected: personalizationStats.rejected,
      truncated: personalizationStats.truncated,
      fenceEscapes: personalizationStats.fenceEscapes,
      redactions: personalizationStats.redactions,
    }));
  }

  // The notice is appended unconditionally — including when history is empty —
  // so its presence never signals anything about the request. Narrowing limits
  // what history can carry; this states what history IS. We do not claim the
  // transcript is verified, because it cannot be in this architecture.
  //
  // It is also the LAST thing in the prompt, after the personalization fence, so
  // the closing word on authority belongs to the system.
  const system =
    buildSynContext(body.context ?? {}, null, evidenceText, personalization) +
    '\n\n' + UNTRUSTED_HISTORY_NOTICE;

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
