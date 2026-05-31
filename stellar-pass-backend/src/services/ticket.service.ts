import pool from '../db/pool';
import redis from '../db/redis';
import { v4 as uuidv4 } from 'uuid';
import { createPlatformMuxedAccount } from '../stellar/muxed';
import { generateKeypair, extractEd25519Seed } from '../utils/crypto';
import { buildQRPayload, generateNonce } from '../utils/qr';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error-handler';
import { z } from 'zod';

export const purchaseTicketSchema = z.object({
  event_id: z.string().uuid(),
  tier_id: z.string().uuid(),
  buyer_wallet: z.string().length(56).startsWith('G'),
  payment_asset: z.enum(['USDC', 'XLM', 'EURC']).default('USDC'),
});

export type PurchaseTicketInput = z.infer<typeof purchaseTicketSchema>;

const SESSION_TTL_MINUTES = 15;

/**
 * Create a purchase session with a muxed account.
 */
export async function createPurchaseSession(
  input: PurchaseTicketInput,
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify event and tier
    const tierResult = await client.query(
      `SELECT tt.*, e.id as event_id, e.status as event_status, e.name as event_name
       FROM ticket_tiers tt
       JOIN events e ON e.id = tt.event_id
       WHERE tt.id = $1 AND tt.event_id = $2`,
      [input.tier_id, input.event_id],
    );

    if (tierResult.rows.length === 0) {
      throw new NotFoundError('Ticket tier not found for this event');
    }

    const tier = tierResult.rows[0];

    if (tier.event_status !== 'on_sale') {
      throw new ValidationError('Event is not currently on sale');
    }

    if (tier.minted >= tier.supply) {
      throw new ConflictError('This tier is sold out');
    }

    // Create muxed account for this session
    const sessionId = uuidv4();
    const { muxedAccount, muxedId } = await createPlatformMuxedAccount(
      input.buyer_wallet,
      sessionId,
    );

    const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);

    // Map currency to asset string
    const assetMap: Record<string, string> = {
      USDC: `USDC:${process.env.USDC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'}`,
      XLM: 'native',
      EURC: `EURC:${process.env.EURC_ISSUER || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'}`,
    };
    const asset = assetMap[input.payment_asset] || assetMap.USDC;

    // Insert purchase session
    const sessionResult = await client.query(
      `INSERT INTO purchase_sessions (
        id, event_id, tier_id, buyer_wallet, muxed_account, muxed_id,
        amount, asset, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
      RETURNING id, muxed_account, amount, asset, expires_at`,
      [
        sessionId,
        input.event_id,
        input.tier_id,
        input.buyer_wallet,
        muxedAccount,
        muxedId.toString(),
        tier.price,
        asset,
        expiresAt.toISOString(),
      ],
    );

    // Cache session in Redis for quick lookup
    await redis.setex(
      `session:${sessionId}`,
      SESSION_TTL_MINUTES * 60,
      JSON.stringify({
        id: sessionId,
        event_id: input.event_id,
        tier_id: input.tier_id,
        buyer_wallet: input.buyer_wallet,
        muxed_account: muxedAccount,
        muxed_id: muxedId.toString(),
        amount: tier.price,
        asset,
        status: 'pending',
      }),
    );

    await client.query('COMMIT');

    const session = sessionResult.rows[0];
    return {
      session_id: session.id,
      muxed_account: session.muxed_account,
      amount: session.amount.toString(),
      asset: session.asset,
      expires_at: session.expires_at,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get ticket detail with QR payload.
 */
export async function getTicketById(ticketId: string) {
  const result = await pool.query(
    `SELECT t.*, tt.name as tier_name, tt.description as tier_description,
            e.name as event_name, e.slug as event_slug, e.date_start, e.venue_name
     FROM tickets t
     JOIN ticket_tiers tt ON tt.id = t.tier_id
     JOIN events e ON e.id = t.event_id
     WHERE t.id = $1`,
    [ticketId],
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Ticket not found');
  }

  const ticket = result.rows[0];

  // Generate QR payload
  const kp = Buffer.from(ticket.qr_secret, 'base64');
  const qrPayload = buildQRPayload(
    {
      ticket_id: ticket.id,
      event_id: ticket.event_id,
      owner: ticket.owner_wallet,
      tier: ticket.tier_name,
      issued_at: Math.floor(new Date(ticket.created_at).getTime() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + 900, // 15 min from now
      nonce: generateNonce(),
    },
    kp,
  );

  return {
    ...ticket,
    qr_payload: qrPayload,
  };
}

/**
 * Get all tickets for an authenticated user.
 */
export async function getMyTickets(ownerWallet: string) {
  const result = await pool.query(
    `SELECT t.id, t.nft_asset_code, t.status, t.purchase_price, t.purchase_currency,
            t.checked_in_at, t.created_at,
            tt.name as tier_name, tt.price as tier_price,
            e.id as event_id, e.name as event_name, e.slug as event_slug,
            e.date_start, e.venue_name, e.image_url
     FROM tickets t
     JOIN ticket_tiers tt ON tt.id = t.tier_id
     JOIN events e ON e.id = t.event_id
     WHERE t.owner_wallet = $1
     ORDER BY t.created_at DESC`,
    [ownerWallet],
  );

  return result.rows;
}

/**
 * Mint a ticket NFT (called after payment confirmation).
 */
export async function mintTicket(
  sessionId: string,
  paymentTxHash: string,
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get session
    const sessionResult = await client.query(
      `SELECT ps.*, tt.name as tier_name, tt.supply, tt.minted, e.name as event_name
       FROM purchase_sessions ps
       JOIN ticket_tiers tt ON tt.id = ps.tier_id
       JOIN events e ON e.id = ps.event_id
       WHERE ps.id = $1 AND ps.status = 'pending'`,
      [sessionId],
    );

    if (sessionResult.rows.length === 0) {
      throw new NotFoundError('Purchase session not found or already processed');
    }

    const session = sessionResult.rows[0];

    if (new Date(session.expires_at) < new Date()) {
      await client.query(
        "UPDATE purchase_sessions SET status = 'expired' WHERE id = $1",
        [sessionId],
      );
      throw new ValidationError('Purchase session has expired');
    }

    if (session.minted >= session.supply) {
      throw new ConflictError('Tier is sold out');
    }

    // Generate QR signing keypair
    const qrKeypair = generateKeypair();
    const qrSecretBase64 = qrKeypair.privateKey.toString('base64');

    // Generate NFT asset code
    const assetCode = `SPAS_${session.event_name.replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase()}_${session.tier_name.replace(/[^A-Z0-9]/gi, '').slice(0, 6).toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;

    // Create ticket
    const ticketResult = await client.query(
      `INSERT INTO tickets (
        tier_id, event_id, owner_wallet, nft_asset_code,
        status, purchase_tx_hash, purchase_price, purchase_currency, qr_secret
      ) VALUES ($1, $2, $3, $4, 'active', $5, $6, $7, $8)
      RETURNING id`,
      [
        session.tier_id,
        session.event_id,
        session.buyer_wallet,
        assetCode,
        paymentTxHash,
        session.amount,
        session.asset.split(':')[0],
        qrSecretBase64,
      ],
    );

    const ticketId = ticketResult.rows[0].id;

    // Update minted count
    await client.query(
      'UPDATE ticket_tiers SET minted = minted + 1 WHERE id = $1',
      [session.tier_id],
    );

    // Mark session as confirmed
    await client.query(
      `UPDATE purchase_sessions
       SET status = 'confirmed', payment_tx_hash = $1, confirmed_at = NOW()
       WHERE id = $2`,
      [paymentTxHash, sessionId],
    );

    // Check if tier is now sold out
    const updatedTier = await client.query(
      'SELECT supply, minted FROM ticket_tiers WHERE id = $1',
      [session.tier_id],
    );

    if (updatedTier.rows[0].minted >= updatedTier.rows[0].supply) {
      // Check if all tiers are sold out
      const allTiers = await client.query(
        `SELECT tt.supply, tt.minted
         FROM ticket_tiers tt
         WHERE tt.event_id = $1`,
        [session.event_id],
      );

      const allSoldOut = allTiers.rows.every(
        (t: { supply: number; minted: number }) => t.minted >= t.supply,
      );

      if (allSoldOut) {
        await client.query(
          "UPDATE events SET status = 'sold_out' WHERE id = $1",
          [session.event_id],
        );
      }
    }

    // Clean up Redis cache
    await redis.del(`session:${sessionId}`);

    await client.query('COMMIT');

    return { ticket_id: ticketId, asset_code: assetCode };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
