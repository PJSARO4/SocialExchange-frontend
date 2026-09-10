/**
 * GET /api/syn/health — owner-gated model provider health check.
 *
 * Answers one question the static config cannot: does the configured provider
 * actually respond? A present env var is not a working key — Vercel currently
 * flags the production ANTHROPIC_API_KEY as "Needs Attention", and only a live
 * call distinguishes present from working.
 *
 * SAFETY PROPERTIES
 *  - Owner-gated with the SAME mechanism as /api/admin/stats and
 *    /api/admin/users. No new identity logic.
 *  - Read-only. Touches no Social Exchange state.
 *  - The smallest possible billable request: max_tokens 1.
 *  - Rate-limited, so an authenticated session cannot be looped into spend.
 *  - Returns status vocabulary only. Never the key, never a key fragment,
 *    never a provider response body, never request headers.
 *  - No polling, no cron, no background job. Invoked by the owner only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

import { resolveProvider, getProviderById, KNOWN_PROVIDER_IDS } from '@/app/syn/model/resolve';
import { ProviderError, HEALTH_TIMEOUT_MS, type ProviderStatus } from '@/app/syn/model/types';
import { anthropicHealthProbe } from '@/app/syn/model/providers/anthropic';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

// Same constant, same value, same comparison as the existing admin routes.
const ADMIN_EMAIL = 'pjsaro4@gmail.com';

/**
 * Cost guard. The organism rate limiter is per-instance and therefore leaky on
 * serverless, but this endpoint is single-owner and manual, so a coarse
 * in-process floor is proportionate: it stops an accidental loop, which is the
 * realistic failure mode here.
 */
const MIN_INTERVAL_MS = 10_000;
let lastCheckAt = 0;

interface HealthResponse {
  provider: string | null;
  status: ProviderStatus;
  model: string | null;
  checkedAt: string;
  /** Non-sensitive explanation. Never provider output. */
  reason?: string;
  /** True when a live request was made; false for static-config answers. */
  probed: boolean;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    // Same shape as the existing admin routes. Deliberately says nothing about
    // whether any provider is configured.
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const checkedAt = new Date().toISOString();

  // Optional ?provider= lets the owner probe a specific adapter without
  // committing SYN_PROVIDER to it. Never used as a fallback.
  const requested = req.nextUrl.searchParams.get('provider')?.trim() || null;

  let providerId: string | null;
  let model: string | null;

  if (requested) {
    const p = getProviderById(requested);
    if (!p) {
      return NextResponse.json<HealthResponse>({
        provider: requested,
        status: 'not_configured',
        model: null,
        checkedAt,
        probed: false,
        reason: `Unknown provider. Known: ${KNOWN_PROVIDER_IDS.join(', ')}.`,
      });
    }
    if (!p.isConfigured()) {
      return NextResponse.json<HealthResponse>({
        provider: p.id,
        status: 'not_configured',
        model: null,
        checkedAt,
        probed: false,
        reason: 'Provider configuration is incomplete.',
      });
    }
    providerId = p.id;
    model = p.modelId();
  } else {
    const resolution = resolveProvider();
    if (resolution.status !== 'ok' || !resolution.provider) {
      return NextResponse.json<HealthResponse>({
        provider: resolution.configuredId,
        status: 'not_configured',
        model: null,
        checkedAt,
        probed: false,
        reason: resolution.reason,
      });
    }
    providerId = resolution.provider.id;
    model = resolution.model;
  }

  // Only Anthropic has a probe in SYN-1A. The others are infrastructure and are
  // deliberately not given live probes yet — reporting static config for them
  // is more honest than pretending we verified something we did not.
  if (providerId !== 'anthropic') {
    return NextResponse.json<HealthResponse>({
      provider: providerId,
      status: 'ok',
      model,
      checkedAt,
      probed: false,
      reason: 'Configuration present. No live probe implemented for this provider in SYN-1A.',
    });
  }

  const now = Date.now();
  if (now - lastCheckAt < MIN_INTERVAL_MS) {
    return NextResponse.json<HealthResponse>({
      provider: providerId,
      status: 'rate_limited',
      model,
      checkedAt,
      probed: false,
      reason: 'Health check throttled locally to avoid repeat billable requests.',
    }, { status: 429 });
  }
  lastCheckAt = now;

  try {
    await anthropicHealthProbe(HEALTH_TIMEOUT_MS);
    return NextResponse.json<HealthResponse>({
      provider: providerId,
      status: 'ok',
      model,
      checkedAt,
      probed: true,
    });
  } catch (err) {
    if (err instanceof ProviderError) {
      // detail is logged, never returned.
      if (err.detail) {
        console.error('[SYN health] provider detail (server-only):', err.detail.slice(0, 300));
      }
      return NextResponse.json<HealthResponse>({
        provider: providerId,
        status: err.status,
        model,
        checkedAt,
        probed: true,
      });
    }
    console.error('[SYN health] unexpected error');
    return NextResponse.json<HealthResponse>({
      provider: providerId,
      status: 'provider_error',
      model,
      checkedAt,
      probed: true,
    });
  }
}
