import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Verify Meta's X-Hub-Signature-256 header against the raw request body.
 *
 * Meta signs webhook payloads with an HMAC-SHA256 keyed on the app secret.
 * The header format is: "sha256=<hex digest>".
 *
 * Instagram webhooks are signed with the Meta app secret. We prefer
 * META_CLIENT_SECRET and fall back to INSTAGRAM_CLIENT_SECRET (both are
 * declared in .env.example).
 *
 * Fail closed: returns false if the signing secret is unset, if the header
 * is missing/malformed, or if the digests do not match.
 */
function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.META_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET;
  if (!appSecret) {
    console.warn('[webhook] No app secret configured (META_CLIENT_SECRET / INSTAGRAM_CLIENT_SECRET) - rejecting');
    return false;
  }

  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const providedHex = signatureHeader.slice('sha256='.length);
  const expectedHex = createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');

  const provided = Buffer.from(providedHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');

  // Guard against length mismatch (timingSafeEqual throws on unequal lengths).
  if (provided.length !== expected.length || provided.length === 0) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

/**
 * Instagram/Meta Webhook Endpoint
 *
 * Handles two types of requests:
 *
 * 1. GET - Webhook verification (Meta sends this when you register the webhook)
 *    Meta sends: hub.mode, hub.verify_token, hub.challenge
 *    We verify the token and echo back the challenge.
 *
 * 2. POST - Webhook events (Meta sends these when events occur)
 *    Events include: mentions, comments, story_insights, etc.
 *
 * Setup in Meta Developer Console:
 *   Callback URL: https://your-domain.vercel.app/api/webhooks/instagram
 *   Verify Token: Set WEBHOOK_VERIFY_TOKEN in env vars
 *
 * Required subscriptions for Instagram:
 *   - mentions: When your account is mentioned
 *   - comments: When someone comments on your posts
 *   - story_insights: When story insights are available
 */

// GET - Webhook verification challenge
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    console.warn('[webhook] WEBHOOK_VERIFY_TOKEN not set - webhook verification disabled');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[webhook] Verification successful');
    // Meta expects the challenge to be returned as plain text
    return new NextResponse(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  console.warn('[webhook] Verification failed - invalid token');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// POST - Receive webhook events
export async function POST(request: NextRequest) {
  try {
    // Read the RAW body first - the signature is computed over the exact bytes,
    // so we must not re-serialize via request.json() before verifying.
    const rawBody = await request.text();

    // Verify the X-Hub-Signature-256 HMAC BEFORE processing anything.
    const signatureHeader = request.headers.get('x-hub-signature-256');
    if (!verifyWebhookSignature(rawBody, signatureHeader)) {
      console.warn('[webhook] Invalid or missing X-Hub-Signature-256 - rejecting request');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);

    // Log the webhook event for debugging
    console.log('[webhook] Received event:', JSON.stringify(body, null, 2));

    // Process different event types
    const { object, entry } = body;

    if (object !== 'instagram') {
      // Not an Instagram webhook - acknowledge but don't process
      return NextResponse.json({ received: true });
    }

    for (const event of entry || []) {
      const { id: pageId, time, changes, messaging } = event;

      // Handle field changes (mentions, comments, story insights)
      if (changes) {
        for (const change of changes) {
          await handleWebhookChange(pageId, change);
        }
      }

      // Handle messaging events (DMs)
      if (messaging) {
        for (const msg of messaging) {
          await handleMessagingEvent(pageId, msg);
        }
      }
    }

    // Always respond 200 quickly to acknowledge receipt
    // Meta will retry if they don't get a 200 within 20 seconds
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[webhook] Error processing event:', error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ received: true, error: error.message });
  }
}

// Handle field change events
async function handleWebhookChange(
  pageId: string,
  change: { field: string; value: any }
) {
  const { field, value } = change;

  switch (field) {
    case 'mentions':
      console.log(`[webhook] Mention received on page ${pageId}:`, value);
      // TODO: Store mention in database, notify user
      break;

    case 'comments':
      console.log(`[webhook] Comment received on page ${pageId}:`, value);
      // TODO: Store comment, trigger auto-reply if automation rule exists
      break;

    case 'story_insights':
      console.log(`[webhook] Story insights for page ${pageId}:`, value);
      // TODO: Store story insights in metrics history
      break;

    case 'live_comments':
      console.log(`[webhook] Live comment on page ${pageId}:`, value);
      break;

    default:
      console.log(`[webhook] Unknown field "${field}" for page ${pageId}:`, value);
  }
}

// Handle messaging events
async function handleMessagingEvent(pageId: string, event: any) {
  const { sender, recipient, message } = event;

  if (message) {
    console.log(`[webhook] DM from ${sender?.id} to page ${pageId}: ${message.text?.substring(0, 50)}`);
    // TODO: Store DM, trigger welcome DM automation if new follower
  }
}
