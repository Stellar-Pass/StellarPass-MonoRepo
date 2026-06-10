import { createPrivateKey, createPublicKey } from 'crypto';
import pool from '../db/pool';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error-handler';
import { verifyQRPayload } from '../utils/qr';
import type { CheckInVerifyResponse } from '@stellar-pass/shared';
import { checkInVerifySchema, checkInBatchSchema } from '@stellar-pass/shared/validation';
import type { z } from 'zod';

// Use shared type as the canonical CheckInResult
type CheckInResult = CheckInVerifyResponse;

export type VerifyCheckInInput = z.infer<typeof checkInVerifySchema>;
export type BatchCheckInInput = z.infer<typeof checkInBatchSchema>;

/**
 * Verify a QR payload and check in the ticket.
 */
export async function verifyAndCheckIn(
  input: VerifyCheckInInput,
): Promise<CheckInResult> {
  let payload;
  try {
    const parsed = JSON.parse(input.qr_payload);
    // We need to find the ticket to get its public key for verification
    const ticketResult = await pool.query(
      `SELECT t.*, tt.name as tier_name
       FROM tickets t
       JOIN ticket_tiers tt ON tt.id = t.tier_id
       WHERE t.id = $1`,
      [parsed.data.ticket_id],
    );

    if (ticketResult.rows.length === 0) {
      throw new NotFoundError('Ticket not found');
    }

    const ticket = ticketResult.rows[0];
    const qrPrivateKey = Buffer.from(ticket.qr_secret, 'base64');

    // Extract public key from private key for verification
    const privateKeyObj = createPrivateKey({
      key: qrPrivateKey,
      format: 'der',
      type: 'pkcs8',
    });
    const publicKeyObj = createPublicKey(privateKeyObj);
    const publicKeyDer = publicKeyObj.export({ type: 'spki', format: 'der' });

    payload = verifyQRPayload(input.qr_payload, publicKeyDer);
  } catch (err) {
    if (err instanceof Error) {
      throw new ValidationError(`QR verification failed: ${err.message}`);
    }
    throw new ValidationError('Invalid QR payload');
  }

  // Get ticket details
  const ticketResult = await pool.query(
    `SELECT t.*, tt.name as tier_name, e.id as event_id, e.organizer_id,
            e.poap_enabled, e.poap_contract_id
     FROM tickets t
     JOIN ticket_tiers tt ON tt.id = t.tier_id
     JOIN events e ON e.id = t.event_id
     WHERE t.id = $1`,
    [payload.ticket_id],
  );

  if (ticketResult.rows.length === 0) {
    throw new NotFoundError('Ticket not found');
  }

  const ticket = ticketResult.rows[0];

  // Verify ownership
  if (ticket.owner_wallet !== payload.owner) {
    throw new ValidationError('QR payload does not match ticket owner');
  }

  // Verify organizer
  const orgResult = await pool.query(
    'SELECT id FROM organizers WHERE stellar_account = $1 AND id = $2',
    [input.organizer_wallet, ticket.organizer_id],
  );
  if (orgResult.rows.length === 0) {
    throw new ValidationError('Only the event organizer can check in tickets');
  }

  // Check if already checked in
  const alreadyCheckedIn = ticket.status === 'used';

  if (alreadyCheckedIn) {
    return {
      valid: true,
      ticket_id: ticket.id,
      attendee: ticket.owner_wallet,
      tier: ticket.tier_name,
      already_checked_in: true,
      poap_minted: false,
      poap_tx_hash: null,
    };
  }

  // Mark as used
  await pool.query(
    `UPDATE tickets
     SET status = 'used', checked_in_at = NOW(), checked_in_by = $1
     WHERE id = $2`,
    [input.organizer_wallet, ticket.id],
  );

  // Mint POAP if enabled
  let poapMinted = false;
  let poapTxHash = null;

  if (ticket.poap_enabled) {
    try {
      const poapAssetCode = `POAP_${ticket.tier_name.replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;

      const poapResult = await pool.query(
        `INSERT INTO poap_badges (event_id, ticket_id, attendee_wallet, nft_asset_code)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [ticket.event_id, ticket.id, ticket.owner_wallet, poapAssetCode],
      );

      poapMinted = true;
      // In production, this would trigger an actual Soroban contract call
      // to mint the POAP NFT on-chain
    } catch (err) {
      // POAP minting failure should not block check-in
      console.error('POAP minting failed:', err);
    }
  }

  return {
    valid: true,
    ticket_id: ticket.id,
    attendee: ticket.owner_wallet,
    tier: ticket.tier_name,
    already_checked_in: false,
    poap_minted: poapMinted,
    poap_tx_hash: poapTxHash,
  };
}

/**
 * Batch check-in for multiple tickets.
 */
export async function batchCheckIn(
  input: BatchCheckInInput,
): Promise<{ results: CheckInResult[] }> {
  const results: CheckInResult[] = [];

  for (const ticketId of input.ticket_ids) {
    try {
      // For batch check-in, we need to look up the ticket's QR payload
      const ticketResult = await pool.query(
        `SELECT t.id FROM tickets t WHERE t.id = $1`,
        [ticketId],
      );

      if (ticketResult.rows.length === 0) {
        results.push({
          valid: false,
          ticket_id: ticketId,
          attendee: '',
          tier: '',
          already_checked_in: false,
          poap_minted: false,
          poap_tx_hash: null,
        });
        continue;
      }

      // Batch check-in requires pre-generated QR payloads
      // This path is for manual ticket ID check-in by organizer
      results.push({
        valid: false,
        ticket_id: ticketId,
        attendee: '',
        tier: '',
        already_checked_in: false,
        poap_minted: false,
        poap_tx_hash: null,
      });
    } catch (err) {
      results.push({
        valid: false,
        ticket_id: ticketId,
        attendee: '',
        tier: '',
        already_checked_in: false,
        poap_minted: false,
        poap_tx_hash: null,
      });
    }
  }

  return { results };
}

/**
 * Get check-in statistics for an event.
 */
export async function getCheckInStatus(eventId: string, organizerWallet: string) {
  // Verify organizer owns the event
  const eventResult = await pool.query(
    `SELECT e.id, e.name
     FROM events e
     JOIN organizers o ON o.id = e.organizer_id
     WHERE e.id = $1 AND o.stellar_account = $2`,
    [eventId, organizerWallet],
  );

  if (eventResult.rows.length === 0) {
    throw new NotFoundError('Event not found or you are not the organizer');
  }

  const statsResult = await pool.query(
    `SELECT
       COUNT(*) as total_tickets,
       COUNT(*) FILTER (WHERE status = 'active') as pending,
       COUNT(*) FILTER (WHERE status = 'used') as checked_in,
       COUNT(*) FILTER (WHERE status = 'frozen') as frozen,
       COUNT(*) FILTER (WHERE status = 'clawed_back') as clawed_back
     FROM tickets
     WHERE event_id = $1`,
    [eventId],
  );

  const stats = statsResult.rows[0];
  const total = parseInt(stats.total_tickets, 10);
  const checkedIn = parseInt(stats.checked_in, 10);

  return {
    event_id: eventId,
    event_name: eventResult.rows[0].name,
    total_tickets: total,
    pending: parseInt(stats.pending, 10),
    checked_in: checkedIn,
    frozen: parseInt(stats.frozen, 10),
    clawed_back: parseInt(stats.clawed_back, 10),
    check_in_rate: total > 0 ? (checkedIn / total) * 100 : 0,
  };
}
