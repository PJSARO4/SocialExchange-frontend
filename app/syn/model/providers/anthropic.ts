/**
 * Anthropic adapter — /v1/messages, hand-rolled fetch, no SDK.
 *
 * Mirrors the request shape already proven in /api/copilot/chat rather than
 * inventing a new one. That route is NOT modified by this milestone; this is a
 * separate, provider-neutral implementation that happens to speak the same wire
 * format.
 *
 * The key is read from process.env at call time, never captured in a module
 * constant, never logged, never returned, never included in a thrown error.
 */

import {
  type ChatRequest,
  type ChatResult,
  type ModelProvider,
  ProviderError,
  DEFAULT_TIMEOUT_MS,
  statusFromHttp,
  errorToStatus,
  withTimeout,
} from '../types';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

function apiKey(): string {
  const k = process.env.ANTHROPIC_API_KEY || '';
  // The repo's placeholder counts as absent — otherwise a template .env reads
  // as "configured" and every call fails with a confusing 401.
  if (!k || k === 'your_anthropic_api_key_here' || k === 'your-anthropic-api-key') return '';
  return k;
}

export const anthropicProvider: ModelProvider = {
  id: 'anthropic',

  isConfigured(): boolean {
    return apiKey().length > 0;
  },

  modelId(): string {
    return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  },

  async chat(req: ChatRequest): Promise<ChatResult> {
    const key = apiKey();
    if (!key) {
      throw new ProviderError('anthropic', 'not_configured', 'Anthropic is not configured');
    }

    const model = this.modelId();

    // Anthropic takes the system prompt out-of-band; any stray 'system' turn in
    // messages would be rejected, so drop it here rather than at the call site.
    const turns = req.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    let res: Response;
    try {
      res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': API_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: req.maxTokens ?? 512,
          ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
          system: req.system,
          messages: turns,
        }),
        signal: withTimeout(req.signal, DEFAULT_TIMEOUT_MS),
      });
    } catch (err) {
      throw new ProviderError(
        'anthropic',
        errorToStatus(err),
        'Anthropic request failed'
        // no detail: fetch/abort errors can carry the request URL
      );
    }

    if (!res.ok) {
      // Read the body ONLY to log server-side. It is never attached to the
      // error surfaced to a client.
      const detail = await res.text().catch(() => '');
      throw new ProviderError(
        'anthropic',
        statusFromHttp(res.status),
        `Anthropic returned ${res.status}`,
        detail.slice(0, 500)
      );
    }

    const data = await res.json().catch(() => null) as {
      content?: Array<{ type?: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    } | null;

    const text = data?.content?.find(b => b?.type === 'text')?.text;
    if (typeof text !== 'string') {
      throw new ProviderError(
        'anthropic',
        'provider_error',
        'Anthropic returned an unexpected response shape'
      );
    }

    return {
      source: 'model',
      provider: 'anthropic',
      model,
      text,
      usage: {
        inputTokens: data?.usage?.input_tokens,
        outputTokens: data?.usage?.output_tokens,
      },
    };
  },
};

/**
 * Smallest possible live call, for the health route.
 *
 * max_tokens: 1 — one token of output. Returns nothing but a normalized status;
 * the response body is never surfaced.
 */
export async function anthropicHealthProbe(timeoutMs: number): Promise<void> {
  const key = apiKey();
  if (!key) {
    throw new ProviderError('anthropic', 'not_configured', 'Anthropic is not configured');
  }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new ProviderError('anthropic', errorToStatus(err), 'Anthropic probe failed');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new ProviderError(
      'anthropic',
      statusFromHttp(res.status),
      `Anthropic probe returned ${res.status}`,
      detail.slice(0, 500)
    );
  }
}
