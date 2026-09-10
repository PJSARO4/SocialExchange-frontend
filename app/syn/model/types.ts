/**
 * SYN model layer — provider-neutral contracts.
 *
 * SYN-1A SCOPE: contracts and adapters only. Nothing in app/api/organism/*
 * imports this yet; live SYN chat is unchanged until SYN-1B.
 *
 * Two rules shape everything in this file:
 *
 *  1. NO PROVIDER ENVELOPE ESCAPES ITS ADAPTER. Callers never see
 *     `data.choices[0].message.content` or `data.content[0].text`. They see
 *     ChatResult. Swapping providers must not ripple outward.
 *
 *  2. PROVENANCE IS NOT OPTIONAL. Every response carries `source`. SYN has been
 *     emitting pattern-matched text that is indistinguishable from model
 *     reasoning; that is the defect this contract exists to make impossible.
 */

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

/**
 * Where a response actually came from.
 *
 *  'model'         a language model generated this. Only an adapter may set it.
 *  'fallback'      the model was unavailable and canned text was substituted.
 *                  MUST carry a FallbackReason.
 *  'deterministic' a system/status answer produced by code on purpose (storage
 *                  totals, capability refusals). Legitimate, but it is NOT
 *                  reasoning and must never be presented as such.
 */
export type ResponseSource = 'model' | 'fallback' | 'deterministic';

/** Why a fallback happened. Normalized so the UI never shows a raw error. */
export type FallbackReason =
  | 'provider_not_configured'
  | 'provider_invalid_key'
  | 'provider_rate_limited'
  | 'provider_timeout'
  | 'provider_error'
  | 'provider_unsupported'
  | 'network_error';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export type ProviderId = 'anthropic' | 'openai-compatible' | 'ollama';

/** Normalized provider state. Mirrors the health route's vocabulary exactly. */
export type ProviderStatus =
  | 'ok'
  | 'not_configured'
  | 'invalid_key'
  | 'rate_limited'
  | 'timeout'
  | 'provider_error';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  /** System prompt, kept separate because Anthropic takes it out-of-band. */
  system: string;
  /** Conversation turns. Adapters must ignore any 'system' role in here. */
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /** Caller-supplied abort. Adapters apply their own timeout regardless. */
  signal?: AbortSignal;
}

/** A real model response. `source` is fixed to 'model' by construction. */
export interface ChatResult {
  source: 'model';
  provider: ProviderId;
  model: string;
  text: string;
  /** Present only when the provider reports it. Never fabricated. */
  usage?: { inputTokens?: number; outputTokens?: number };
}

/**
 * A normalized provider failure.
 *
 * `detail` is for SERVER-SIDE LOGGING ONLY and must never be returned to a
 * client: provider error bodies can echo request metadata. Route handlers
 * surface `status` (and at most a short generic message), never `detail`.
 */
export class ProviderError extends Error {
  readonly status: Exclude<ProviderStatus, 'ok'>;
  readonly provider: ProviderId;
  readonly detail?: string;

  constructor(
    provider: ProviderId,
    status: Exclude<ProviderStatus, 'ok'>,
    message: string,
    detail?: string
  ) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.status = status;
    this.detail = detail;
  }

  /** The fallback reason this failure maps to. */
  toFallbackReason(): FallbackReason {
    switch (this.status) {
      case 'not_configured': return 'provider_not_configured';
      case 'invalid_key':    return 'provider_invalid_key';
      case 'rate_limited':   return 'provider_rate_limited';
      case 'timeout':        return 'provider_timeout';
      default:               return 'provider_error';
    }
  }
}

export interface ModelProvider {
  readonly id: ProviderId;
  /** True when every env var this provider needs is present. Never a live call. */
  isConfigured(): boolean;
  /** The model id this provider would use. For display and health reporting. */
  modelId(): string;
  /** Perform a chat completion. Throws ProviderError on any failure. */
  chat(req: ChatRequest): Promise<ChatResult>;
}

// ---------------------------------------------------------------------------
// Shared adapter helpers
// ---------------------------------------------------------------------------

/**
 * Default per-request timeout. Deliberately well under the 10s Vercel Hobby
 * function ceiling so the route can return a normalized error rather than
 * being killed mid-flight and surfacing as an opaque 504.
 */
export const DEFAULT_TIMEOUT_MS = 8_000;

/** Health checks are one token; they should fail fast. */
export const HEALTH_TIMEOUT_MS = 5_000;

/** Map an HTTP status from any provider onto our vocabulary. */
export function statusFromHttp(code: number): Exclude<ProviderStatus, 'ok'> {
  if (code === 401 || code === 403) return 'invalid_key';
  if (code === 429) return 'rate_limited';
  return 'provider_error';
}

/**
 * Combine the caller's signal with our own timeout.
 *
 * AbortSignal.any is not available on every runtime this may run on, so fall
 * back to the timeout alone rather than throwing at module load.
 */
export function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  if (!signal) return timeout;
  const anyFn = (AbortSignal as unknown as {
    any?: (s: AbortSignal[]) => AbortSignal;
  }).any;
  return typeof anyFn === 'function' ? anyFn([signal, timeout]) : timeout;
}

/** Classify a thrown fetch/abort error without leaking its message. */
export function errorToStatus(err: unknown): Exclude<ProviderStatus, 'ok'> {
  const name = (err as { name?: string })?.name;
  if (name === 'TimeoutError' || name === 'AbortError') return 'timeout';
  return 'provider_error';
}
