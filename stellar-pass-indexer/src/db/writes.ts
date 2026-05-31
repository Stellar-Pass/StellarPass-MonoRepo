import { pool } from './pool';
import { createChildLogger } from '../utils/logger';
import type {
  PurchaseSessionStatus,
  TicketStatus,
  WebhookEventType,
  PurchaseSession,
  POAPBadge,
  WebhookDelivery,
  Webhook,
} from '@stellar-pass/shared';

const log = createChildLogger('db-writes');

// --- Derived types from shared ---

export type { PurchaseSessionStatus, TicketStatus, WebhookEventType, PurchaseSession };

export interface ActiveMuxedAccount {
  id: string;
  muxed_account: string;
  amount: number;
  asset: string;
  buyer_wallet: string;
  event_id: string;
  tier_id: string;
  expires_at: string;
}

// Insert type: POAPBadge without minted_at (auto-set by DB)
export type POAPBadgeInsert = Omit<POAPBadge, 'minted_at'>;

// Insert type: WebhookDelivery without delivered_at (auto-set by DB)
export type WebhookDeliveryInsert = Omit<WebhookDelivery, 'delivered_at'>;

// Subset of Webhook needed for dispatch
export type WebhookConfig = Pick<Webhook, 'id' | 'url' | 'secret' | 'events'>;

// --- Write helpers ---

export async function updateSessionStatus(
  sessionId: string,
  status: PurchaseSessionStatus,
  txHash?: string,
): Promise<void> {
  try {
    const confirmedAt = status === 'confirmed' ? 'NOW()' : 'NULL';
    const paymentTxHash = txHash ?? null;

    await pool.query(
      `UPDATE purchase_sessions
       SET status = $1,
           payment_tx_hash = COALESCE($2, payment_tx_hash),
           confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END,
           updated_at = NOW()
       WHERE id = $3`,
      [status, paymentTxHash, sessionId],
    );
    log.info({ sessionId, status, txHash }, 'Session status updated');
  } catch (err) {
    log.error({ err, sessionId, status }, 'Failed to update session status');
    throw err;
  }
}

export async function updateTicketOwner(
  ticketId: string,
  newOwner: string,
): Promise<void> {
  try {
    await pool.query(
      `UPDATE tickets
       SET owner_wallet = $1, updated_at = NOW()
       WHERE id = $2`,
      [newOwner, ticketId],
    );
    log.info({ ticketId, newOwner }, 'Ticket owner updated');
  } catch (err) {
    log.error({ err, ticketId, newOwner }, 'Failed to update ticket owner');
    throw err;
  }
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<void> {
  try {
    await pool.query(
      `UPDATE tickets
       SET status = $1, updated_at = NOW()
       WHERE id = $2`,
      [status, ticketId],
    );
    log.info({ ticketId, status }, 'Ticket status updated');
  } catch (err) {
    log.error({ err, ticketId, status }, 'Failed to update ticket status');
    throw err;
  }
}

export async function createPOAPBadge(data: POAPBadgeInsert): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO poap_badges (id, event_id, ticket_id, attendee_wallet, nft_asset_code, mint_tx_hash, metadata_uri, minted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [data.id, data.event_id, data.ticket_id, data.attendee_wallet, data.nft_asset_code, data.mint_tx_hash, data.metadata_uri],
    );
    log.info({ badgeId: data.id, eventId: data.event_id, attendee: data.attendee_wallet }, 'POAP badge created');
  } catch (err) {
    log.error({ err, data }, 'Failed to create POAP badge');
    throw err;
  }
}

export async function createWebhookDelivery(data: WebhookDeliveryInsert): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, response_code, response_body, success, delivered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [data.id, data.webhook_id, data.event_type, JSON.stringify(data.payload), data.response_code, data.response_body, data.success],
    );
    log.info({ deliveryId: data.id, webhookId: data.webhook_id, eventType: data.event_type, success: data.success }, 'Webhook delivery logged');
  } catch (err) {
    log.error({ err, data }, 'Failed to log webhook delivery');
    throw err;
  }
}

export async function getPendingSessions(): Promise<PurchaseSession[]> {
  try {
    const result = await pool.query<PurchaseSession>(
      `SELECT id, event_id, tier_id, buyer_wallet, muxed_account, muxed_id, amount, asset, status, payment_tx_hash, expires_at, confirmed_at, created_at
       FROM purchase_sessions
       WHERE status = 'pending'
         AND expires_at > NOW()
       ORDER BY created_at ASC`,
    );
    log.info({ count: result.rows.length }, 'Fetched pending sessions');
    return result.rows;
  } catch (err) {
    log.error({ err }, 'Failed to fetch pending sessions');
    throw err;
  }
}

export async function getActiveMuxedAccounts(): Promise<ActiveMuxedAccount[]> {
  try {
    const result = await pool.query<ActiveMuxedAccount>(
      `SELECT ps.id, ps.muxed_account, ps.amount, ps.asset, ps.buyer_wallet, ps.event_id, ps.tier_id, ps.expires_at
       FROM purchase_sessions ps
       WHERE ps.status = 'pending'
         AND ps.expires_at > NOW()
       ORDER BY ps.created_at ASC`,
    );
    return result.rows;
  } catch (err) {
    log.error({ err }, 'Failed to fetch active muxed accounts');
    throw err;
  }
}

export async function getWebhooksForOrganizer(organizerId: string): Promise<WebhookConfig[]> {
  try {
    const result = await pool.query<WebhookConfig>(
      `SELECT w.id, w.url, w.secret, w.events
       FROM webhooks w
       WHERE w.organizer_id = $1
         AND w.active = true`,
      [organizerId],
    );
    return result.rows;
  } catch (err) {
    log.error({ err, organizerId }, 'Failed to fetch webhooks for organizer');
    throw err;
  }
}

export async function getOrganizerIdForEvent(eventId: string): Promise<string | null> {
  try {
    const result = await pool.query(
      `SELECT organizer_id FROM events WHERE id = $1`,
      [eventId],
    );
    return result.rows[0]?.organizer_id ?? null;
  } catch (err) {
    log.error({ err, eventId }, 'Failed to fetch organizer for event');
    throw err;
  }
}

export async function getOrganizerIdForTicket(ticketId: string): Promise<{ organizerId: string; eventId: string } | null> {
  try {
    const result = await pool.query(
      `SELECT e.organizer_id AS "organizerId", t.event_id AS "eventId"
       FROM tickets t
       JOIN events e ON e.id = t.event_id
       WHERE t.id = $1`,
      [ticketId],
    );
    return result.rows[0] ?? null;
  } catch (err) {
    log.error({ err, ticketId }, 'Failed to fetch organizer for ticket');
    throw err;
  }
}

export async function markSessionExpired(sessionId: string): Promise<void> {
  try {
    await pool.query(
      `UPDATE purchase_sessions
       SET status = 'expired', updated_at = NOW()
       WHERE id = $1 AND status = 'pending'`,
      [sessionId],
    );
    log.info({ sessionId }, 'Session marked as expired');
  } catch (err) {
    log.error({ err, sessionId }, 'Failed to mark session expired');
    throw err;
  }
}
