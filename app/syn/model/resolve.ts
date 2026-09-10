/**
 * Provider resolution — EXPLICIT ONLY.
 *
 * There is deliberately no automatic failover in this file. If the configured
 * provider is unavailable, invalid, rate-limited or timing out, the resolver
 * reports that. It does not quietly try a different model.
 *
 * Why that matters: silent provider hopping means an operator can never answer
 * "which model produced this?" — and the whole reason SYN-1A exists is that SYN
 * has been producing text of unknowable origin. Failover, when we want it, will
 * be an explicit ordered list, not an accident.
 *
 * SYN_PROVIDER must be set. A present ANTHROPIC_API_KEY does NOT imply
 * SYN_PROVIDER=anthropic: a key existing for Copilot is not consent for SYN to
 * start spending it.
 */

import type { ModelProvider, ProviderId, ProviderStatus } from './types';
import { anthropicProvider } from './providers/anthropic';
import { openAICompatibleProvider } from './providers/openai-compatible';
import { ollamaProvider } from './providers/ollama';

const PROVIDERS: Record<ProviderId, ModelProvider> = {
  anthropic: anthropicProvider,
  'openai-compatible': openAICompatibleProvider,
  ollama: ollamaProvider,
};

export const KNOWN_PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export interface Resolution {
  /** The provider named by SYN_PROVIDER, if it is a known id AND configured. */
  provider: ModelProvider | null;
  /** The raw configured id, even when unusable — for reporting. */
  configuredId: string | null;
  /** 'ok' means selected and configured. It does NOT mean reachable. */
  status: Extract<ProviderStatus, 'ok' | 'not_configured'>;
  /** Model id when resolvable. */
  model: string | null;
  /** Operator-facing explanation when status is not 'ok'. Never a secret. */
  reason?: string;
}

function isProviderId(v: string): v is ProviderId {
  return (KNOWN_PROVIDER_IDS as string[]).includes(v);
}

/**
 * Resolve the single explicitly configured provider.
 *
 * Static configuration only — no network call. 'ok' here means "SYN_PROVIDER
 * names a known provider and that provider's env vars are present". Whether the
 * provider actually answers is a separate question, answered by the health
 * route.
 */
export function resolveProvider(): Resolution {
  const configured = (process.env.SYN_PROVIDER || '').trim();

  if (!configured) {
    return {
      provider: null,
      configuredId: null,
      status: 'not_configured',
      model: null,
      reason: 'SYN_PROVIDER is not set. Provider selection must be explicit.',
    };
  }

  if (!isProviderId(configured)) {
    return {
      provider: null,
      configuredId: configured,
      status: 'not_configured',
      model: null,
      reason: `SYN_PROVIDER "${configured}" is not a known provider. Known: ${KNOWN_PROVIDER_IDS.join(', ')}.`,
    };
  }

  const provider = PROVIDERS[configured];

  if (!provider.isConfigured()) {
    return {
      provider: null,
      configuredId: configured,
      status: 'not_configured',
      model: null,
      reason: `Provider "${configured}" is selected but its configuration is incomplete.`,
    };
  }

  return {
    provider,
    configuredId: configured,
    status: 'ok',
    model: provider.modelId(),
  };
}

/**
 * Look up a provider by id, bypassing SYN_PROVIDER.
 *
 * For the health route only, so an operator can probe a provider before
 * committing SYN to it. This is NOT a failover path — callers doing real work
 * must go through resolveProvider().
 */
export function getProviderById(id: string): ModelProvider | null {
  return isProviderId(id) ? PROVIDERS[id] : null;
}
