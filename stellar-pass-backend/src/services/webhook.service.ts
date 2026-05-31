import pool from '../db/pool';
import crypto from 'crypto';
import { NotFoundError, ForbiddenError } from '../middleware/error-handler';
import type { WebhookEventType } from '@stellar-pass/shared';
import { z } from 'zod';

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'ticket.purchased',
    'ticket.checked_in',
    'ticket.frozen',
    'ticket.clawed_back',
    'poap.minted',
    'event.sold_out',
  ])).min(1),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

/**
 * Create a new webhook for an organizer.
 */
export async function createWebhook(
  organizerWallet: string,
  input: CreateWebhookInput,
) {
  const secret = crypto.randomBytes(32).toString('hex');

  const orgResult = await pool.query(
    'SELECT id FROM organizers WHERE stellar_account = $1',
    [organizerWallet],
  );

  if (orgResult.rows.length === 0) {
    throw new NotFoundError('Organizer not found');
  }

  const organizerId = orgResult.rows[0].id;

  const result = await pool.query(
    `INSERT INTO webhooks (organizer_id, url, secret, events)
     VALUES ($1, $2, $3, $4)
     RETURNING id, url, events, active, created_at`,
    [organizerId, input.url, secret, input.events],
  );

  return {
    ...result.rows[0],
    secret, // Only returned on creation
  };
}

/**
 * List all webhooks for an organizer.
 */
export async function listWebhooks(organizerWallet: string) {
  const result = await pool.query(
    `SELECT w.id, w.url, w.events, w.active, w.created_at
     FROM webhooks w
     JOIN organizers o ON o.id = w.organizer_id
     WHERE o.stellar_account = $1
     ORDER BY w.created_at DESC`,
    [organizerWallet],
  );

  return result.rows;
}

/**
 * Delete a webhook (only by its owner).
 */
export async function deleteWebhook(
  webhookId: string,
  organizerWallet: string,
) {
  const result = await pool.query(
    `DELETE FROM webhooks w
     USING organizers o
     WHERE w.id = $1 AND o.id = w.organizer_id AND o.stellar_account = $2
     RETURNING w.id`,
    [webhookId, organizerWallet],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Webhook not found or you are not the owner');
  }

  return { deleted: true };
}

/**
 * Dispatch a webhook event to all matching webhooks.
 */
export async function dispatchWebhook(
  organizerId: string,
  eventType: WebhookEventType,
  payload: Record<string, unknown>,
) {
  const webhooksResult = await pool.query(
    `SELECT id, url, secret, events
     FROM webhooks
     WHERE organizer_id = $1 AND active = true AND $2 = ANY(events)`,
    [organizerId, eventType],
  );

  const webhooks = webhooksResult.rows;

  const dispatchPromises = webhooks.map(async (webhook: { id: string; url: string; secret: string }) => {
    const body = JSON.stringify({
      event: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    });

    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-StellarPass-Signature': `sha256=${signature}`,
          'X-StellarPass-Event': eventType,
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseBody = await response.text();

      await pool.query(
        `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, response_code, response_body, success)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [webhook.id, eventType, payload, response.status, responseBody, response.ok],
      );

      return { webhook_id: webhook.id, success: response.ok, status: response.status };
    } catch (err) {
      await pool.query(
        `INSERT INTO webhook_deliveries (webhook_id, event_type, payload, response_code, response_body, success)
         VALUES ($1, $2, $3, $4, $5, false)`,
        [webhook.id, eventType, payload, 0, err instanceof Error ? err.message : 'Unknown error'],
      );

      return { webhook_id: webhook.id, success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  });

  return Promise.allSettled(dispatchPromises);
}
