import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { createChildLogger } from '../utils/logger';
import { createWebhookDelivery, getWebhooksForOrganizer, type WebhookDeliveryInsert, type WebhookEventType } from '../db/writes';

const log = createChildLogger('webhook-dispatcher');

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export interface WebhookPayload {
  event: WebhookEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Deliver a webhook to all registered webhooks for an organizer
 * that subscribe to the given event type.
 *
 * Uses HMAC-SHA256 for payload signing and exponential backoff for retries.
 */
export async function deliverWebhook(
  organizerId: string,
  event: WebhookEventType,
  data: Record<string, unknown>,
): Promise<void> {
  let webhooks;
  try {
    webhooks = await getWebhooksForOrganizer(organizerId);
  } catch (err) {
    log.error({ err, organizerId }, 'Failed to fetch webhooks');
    return;
  }

  const matchingWebhooks = webhooks.filter((w) => w.events.includes(event));

  if (matchingWebhooks.length === 0) {
    log.debug({ organizerId, event }, 'No webhooks registered for event');
    return;
  }

  const payload: WebhookPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  const deliveryPromises = matchingWebhooks.map((webhook) =>
    deliverToWebhookWithRetry(webhook.id, webhook.url, webhook.secret, payload),
  );

  await Promise.allSettled(deliveryPromises);
}

/**
 * Deliver to a single webhook URL with exponential backoff retry.
 */
async function deliverToWebhookWithRetry(
  webhookId: string,
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<void> {
  let lastError: Error | null = null;
  let lastStatusCode: number | null = null;
  let lastResponseBody: string | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await deliverOnce(url, secret, payload);
      lastStatusCode = result.statusCode;
      lastResponseBody = result.body;

      if (result.statusCode >= 200 && result.statusCode < 300) {
        // Success
        await logDelivery(webhookId, payload.event, payload, result.statusCode, result.body, true);
        log.info({ webhookId, statusCode: result.statusCode, attempt }, 'Webhook delivered successfully');
        return;
      }

      // Non-2xx response — retry
      log.warn(
        { webhookId, statusCode: result.statusCode, attempt },
        'Webhook delivery returned non-2xx',
      );
    } catch (err) {
      lastError = err as Error;
      log.warn(
        { err, webhookId, attempt },
        'Webhook delivery attempt failed',
      );
    }

    // Exponential backoff before retry
    if (attempt < MAX_RETRIES) {
      const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      log.debug({ webhookId, attempt, backoffMs: backoff }, 'Retrying webhook delivery');
      await sleep(backoff);
    }
  }

  // All retries exhausted — log as dead letter
  await logDelivery(
    webhookId,
    payload.event,
    payload,
    lastStatusCode,
    lastResponseBody ?? lastError?.message ?? 'Unknown error',
    false,
  );
  log.error(
    { webhookId, retries: MAX_RETRIES, lastStatusCode, lastError: lastError?.message },
    'Webhook delivery failed after max retries (dead letter)',
  );
}

/**
 * Single delivery attempt.
 */
async function deliverOnce(
  url: string,
  secret: string,
  payload: WebhookPayload,
): Promise<{ statusCode: number; body: string }> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-StellarPass-Signature': signature,
        'X-StellarPass-Timestamp': payload.timestamp,
        'User-Agent': 'StellarPass-Indexer/1.0',
      },
      body,
      signal: controller.signal,
    });

    const responseBody = await response.text().catch(() => '');

    return {
      statusCode: response.status,
      body: responseBody,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sign the payload with HMAC-SHA256.
 */
function signPayload(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

/**
 * Log webhook delivery to the database.
 */
async function logDelivery(
  webhookId: string,
  eventType: WebhookEventType,
  payload: Record<string, unknown>,
  responseCode: number | null,
  responseBody: string,
  success: boolean,
): Promise<void> {
  const delivery: WebhookDeliveryInsert = {
    id: uuidv4(),
    webhook_id: webhookId,
    event_type: eventType,
    payload,
    response_code: responseCode,
    response_body: responseBody.substring(0, 1000), // Truncate large bodies
    success,
  };

  try {
    await createWebhookDelivery(delivery);
  } catch (err) {
    log.error({ err, webhookId }, 'Failed to log webhook delivery');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
