/**
 * OpenAI-compatible adapter — POST {baseUrl}/chat/completions.
 *
 * SYN-1A: INFRASTRUCTURE ONLY. Not configured, no credentials, never selected
 * automatically. It exists so that adding a provider later is a config change
 * rather than a code change.
 *
 * Env names are the ones the codebase already uses (QWEN_*), because that is
 * what the existing qwen-client.ts reads and what any future migration will
 * need to stay compatible with. The adapter itself is not Qwen-specific — this
 * wire format is shared by Qwen/DashScope, Ollama's compatibility endpoint,
 * OpenAI, Together, Groq and most self-hosted servers.
 *
 * qwen-client.ts is NOT modified by this milestone and still owns live SYN chat.
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

const DEFAULT_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
const DEFAULT_MODEL = 'qwen-turbo';

function baseUrl(): string {
  return (process.env.QWEN_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function apiKey(): string {
  return process.env.QWEN_API_KEY || '';
}

export const openAICompatibleProvider: ModelProvider = {
  id: 'openai-compatible',

  isConfigured(): boolean {
    // A base URL alone is not enough: a hosted endpoint without a key will just
    // 401. Local servers that need no key should use the ollama provider.
    return apiKey().length > 0;
  },

  modelId(): string {
    return process.env.QWEN_MODEL || DEFAULT_MODEL;
  },

  async chat(req: ChatRequest): Promise<ChatResult> {
    const key = apiKey();
    if (!key) {
      throw new ProviderError(
        'openai-compatible',
        'not_configured',
        'OpenAI-compatible provider is not configured'
      );
    }

    const model = this.modelId();

    // This wire format carries the system prompt as the first message.
    const messages = [
      { role: 'system' as const, content: req.system },
      ...req.messages.filter(m => m.role !== 'system'),
    ];

    let res: Response;
    try {
      res = await fetch(`${baseUrl()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: req.maxTokens ?? 512,
          temperature: req.temperature ?? 0.7,
        }),
        signal: withTimeout(req.signal, DEFAULT_TIMEOUT_MS),
      });
    } catch (err) {
      throw new ProviderError(
        'openai-compatible',
        errorToStatus(err),
        'OpenAI-compatible request failed'
      );
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new ProviderError(
        'openai-compatible',
        statusFromHttp(res.status),
        `Provider returned ${res.status}`,
        detail.slice(0, 500)
      );
    }

    const data = await res.json().catch(() => null) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    } | null;

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new ProviderError(
        'openai-compatible',
        'provider_error',
        'Provider returned an unexpected response shape'
      );
    }

    return {
      source: 'model',
      provider: 'openai-compatible',
      model,
      text,
      usage: {
        inputTokens: data?.usage?.prompt_tokens,
        outputTokens: data?.usage?.completion_tokens,
      },
    };
  },
};
