/**
 * Ollama native adapter — POST {OLLAMA_URL}/api/chat.
 *
 * SYN-1A: INFRASTRUCTURE ONLY. Not configured, never selected automatically.
 *
 * Uses /api/chat rather than the /api/generate endpoint that
 * app/lib/social/caption.ts uses, because /api/chat takes structured turns and
 * a system role, which is what ChatRequest carries. caption.ts is a protected
 * file and is not touched by this milestone.
 *
 * No API key: Ollama is unauthenticated and expected to be reachable on a
 * private network. Configuration here means OLLAMA_URL being set.
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

const DEFAULT_MODEL = 'llama3.2';

function baseUrl(): string {
  return (process.env.OLLAMA_URL || '').replace(/\/+$/, '');
}

export const ollamaProvider: ModelProvider = {
  id: 'ollama',

  isConfigured(): boolean {
    return baseUrl().length > 0;
  },

  modelId(): string {
    return process.env.OLLAMA_MODEL || DEFAULT_MODEL;
  },

  async chat(req: ChatRequest): Promise<ChatResult> {
    const base = baseUrl();
    if (!base) {
      throw new ProviderError('ollama', 'not_configured', 'Ollama is not configured');
    }

    const model = this.modelId();

    const messages = [
      { role: 'system' as const, content: req.system },
      ...req.messages.filter(m => m.role !== 'system'),
    ];

    let res: Response;
    try {
      res = await fetch(`${base}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: {
            temperature: req.temperature ?? 0.7,
            num_predict: req.maxTokens ?? 512,
          },
        }),
        signal: withTimeout(req.signal, DEFAULT_TIMEOUT_MS),
      });
    } catch (err) {
      // A self-hosted box being unreachable is the common case here.
      throw new ProviderError('ollama', errorToStatus(err), 'Ollama request failed');
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new ProviderError(
        'ollama',
        statusFromHttp(res.status),
        `Ollama returned ${res.status}`,
        detail.slice(0, 500)
      );
    }

    const data = await res.json().catch(() => null) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    } | null;

    const text = data?.message?.content;
    if (typeof text !== 'string') {
      throw new ProviderError(
        'ollama',
        'provider_error',
        'Ollama returned an unexpected response shape'
      );
    }

    return {
      source: 'model',
      provider: 'ollama',
      model,
      text,
      usage: {
        inputTokens: data?.prompt_eval_count,
        outputTokens: data?.eval_count,
      },
    };
  },
};
