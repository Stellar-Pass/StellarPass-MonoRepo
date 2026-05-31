import { v4 as uuidv4 } from 'uuid';
import { redisSub, CHANNELS } from '../db/redis';
import { pool } from '../db/pool';
import {
  updateSessionStatus,
  updateTicketOwner,
  updateTicketStatus,
  createPOAPBadge,
  getOrganizerIdForEvent,
  getOrganizerIdForTicket,
} from '../db/writes';
import { deliverWebhook } from './webhook.dispatcher';
import { createChildLogger } from '../utils/logger';

const log = createChildLogger('event-dispatcher');

// Track whether the subscriber is connected
let isSubscribed = false;

/**
 * Start the event dispatcher.
 * Subscribes to all Redis pub/sub channels and routes events to handlers.
 */
export async function startEventDispatcher(): Promise<void> {
  log.info('Starting event dispatcher');

  // Subscribe to all channels
  const channels = Object.values(CHANNELS);
  await redisSub.subscribe(...channels);
  isSubscribed = true;

  redisSub.on('message', (channel: string, message: string) => {
    handleMessage(channel, message).catch((err) => {
      log.error({ err, channel }, 'Error handling event message');
    });
  });

  log.info({ channels }, 'Event dispatcher subscribed to channels');
}

/**
 * Route a message to the appropriate handler based on channel.
 */
async function handleMessage(channel: string, message: string): Promise<void> {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(message);
  } catch (err) {
    log.error({ err, channel, message: message.substring(0, 200) }, 'Invalid JSON in event message');
    return;
  }

  log.debug({ channel, data }, 'Received event');

  switch (channel) {
    case CHANNELS.PAYMENT_CONFIRMED:
      await handlePaymentConfirmed(data);
      break;
    case CHANNELS.NFT_TRANSFERRED:
      await handleNftTransferred(data);
      break;
    case CHANNELS.NFT_FROZEN:
      await handleNftFrozen(data);
      break;
    case CHANNELS.NFT_CLAWED_BACK:
      await handleNftClawedBack(data);
      break;
    case CHANNELS.POAP_MINTED:
      await handlePoapMinted(data);
      break;
    default:
      log.warn({ channel }, 'Unknown event channel');
  }
}

// --- Event Handlers ---

/**
 * Handle payment.confirmed:
 * 1. Update session status to 'confirmed'
 * 2. Log the confirmation (ticket mint trigger happens on-chain; we observe the mint via contract events)
 * 3. Send webhook to organizer
 */
async function handlePaymentConfirmed(data: Record<string, unknown>): Promise<void> {
  const {
    sessionId,
    txHash,
    amount,
    asset,
    buyerWallet,
    eventId,
    tierId,
  } = data as {
    sessionId: string;
    txHash: string;
    amount: number;
    asset: string;
    buyerWallet: string;
    eventId: string;
    tierId: string;
  };

  if (!sessionId || !txHash) {
    log.error({ data }, 'payment.confirmed missing required fields');
    return;
  }

  log.info({ sessionId, txHash, amount, asset }, 'Processing payment.confirmed');

  // 1. Update session to confirmed
  try {
    await updateSessionStatus(sessionId, 'confirmed', txHash);
  } catch (err) {
    log.error({ err, sessionId }, 'Failed to update session to confirmed');
    return;
  }

  // 2. Notify organizer via webhook
  try {
    const organizerId = await getOrganizerIdForEvent(eventId);
    if (organizerId) {
      await deliverWebhook(organizerId, 'ticket.purchased', {
        session_id: sessionId,
        event_id: eventId,
        tier_id: tierId,
        buyer_wallet: buyerWallet,
        amount,
        asset,
        tx_hash: txHash,
      });
    }
  } catch (err) {
    log.error({ err, sessionId }, 'Failed to send payment.confirmed webhook');
  }
}

/**
 * Handle nft.transferred:
 * 1. Update ticket owner in DB
 * 2. Log the transfer
 */
async function handleNftTransferred(data: Record<string, unknown>): Promise<void> {
  const { from, to, tokenId, txHash, contractId } = data as {
    from: string;
    to: string;
    tokenId: string;
    txHash: string;
    contractId: string;
  };

  if (!to || !tokenId) {
    log.error({ data }, 'nft.transferred missing required fields');
    return;
  }

  log.info({ from, to, tokenId, txHash }, 'Processing nft.transferred');

  // Lookup ticket by NFT token ID (nft_asset_code or id)
  // The token ID from the contract maps to the ticket's nft_asset_code
  try {
    const ticket = await lookupTicketByTokenId(tokenId, contractId);
    if (ticket) {
      await updateTicketOwner(ticket.id, to);
    } else {
      log.warn({ tokenId, contractId }, 'Could not find ticket for transferred token');
    }
  } catch (err) {
    log.error({ err, tokenId }, 'Failed to process nft.transferred');
  }
}

/**
 * Handle nft.frozen:
 * 1. Update ticket status to 'frozen'
 * 2. Send webhook
 */
async function handleNftFrozen(data: Record<string, unknown>): Promise<void> {
  const { tokenId, txHash, contractId } = data as {
    tokenId: string;
    txHash: string;
    contractId: string;
  };

  if (!tokenId) {
    log.error({ data }, 'nft.frozen missing required fields');
    return;
  }

  log.info({ tokenId, txHash }, 'Processing nft.frozen');

  try {
    const ticket = await lookupTicketByTokenId(tokenId, contractId);
    if (ticket) {
      await updateTicketStatus(ticket.id, 'frozen');

      // Send webhook
      const info = await getOrganizerIdForTicket(ticket.id);
      if (info) {
        await deliverWebhook(info.organizerId, 'ticket.frozen', {
          ticket_id: ticket.id,
          event_id: info.eventId,
          owner_wallet: ticket.owner_wallet,
          tx_hash: txHash,
        });
      }
    }
  } catch (err) {
    log.error({ err, tokenId }, 'Failed to process nft.frozen');
  }
}

/**
 * Handle nft.clawed_back:
 * 1. Update ticket status to 'clawed_back'
 * 2. Send webhook
 */
async function handleNftClawedBack(data: Record<string, unknown>): Promise<void> {
  const { tokenId, txHash, contractId } = data as {
    tokenId: string;
    txHash: string;
    contractId: string;
  };

  if (!tokenId) {
    log.error({ data }, 'nft.clawed_back missing required fields');
    return;
  }

  log.info({ tokenId, txHash }, 'Processing nft.clawed_back');

  try {
    const ticket = await lookupTicketByTokenId(tokenId, contractId);
    if (ticket) {
      await updateTicketStatus(ticket.id, 'clawed_back');

      const info = await getOrganizerIdForTicket(ticket.id);
      if (info) {
        await deliverWebhook(info.organizerId, 'ticket.clawed_back', {
          ticket_id: ticket.id,
          event_id: info.eventId,
          owner_wallet: ticket.owner_wallet,
          tx_hash: txHash,
        });
      }
    }
  } catch (err) {
    log.error({ err, tokenId }, 'Failed to process nft.clawed_back');
  }
}

/**
 * Handle poap.minted:
 * 1. Create POAP badge record in DB
 * 2. Send webhook
 */
async function handlePoapMinted(data: Record<string, unknown>): Promise<void> {
  const { tokenId, to, txHash, contractId, metadata } = data as {
    tokenId: string;
    to: string;
    txHash: string;
    contractId: string;
    metadata?: Record<string, unknown>;
  };

  if (!tokenId || !to) {
    log.error({ data }, 'poap.minted missing required fields');
    return;
  }

  log.info({ tokenId, to, txHash }, 'Processing poap.minted');

  try {
    // Look up the ticket for this attendee to link the POAP
    const ticket = await lookupTicketByOwnerAndContract(to, contractId);

    const badge = {
      id: uuidv4(),
      event_id: ticket?.event_id ?? '',
      ticket_id: ticket?.id ?? '',
      attendee_wallet: to,
      nft_asset_code: tokenId,
      mint_tx_hash: txHash ?? null,
      metadata_uri: (metadata?.uri as string) ?? null,
    };

    await createPOAPBadge(badge);

    // Send webhook if we have the event info
    if (ticket?.event_id) {
      const organizerId = await getOrganizerIdForEvent(ticket.event_id);
      if (organizerId) {
        await deliverWebhook(organizerId, 'poap.minted', {
          badge_id: badge.id,
          event_id: badge.event_id,
          ticket_id: badge.ticket_id,
          attendee_wallet: to,
          nft_asset_code: tokenId,
          tx_hash: txHash,
        });
      }
    }
  } catch (err) {
    log.error({ err, tokenId }, 'Failed to process poap.minted');
  }
}

// --- DB lookup helpers ---

interface TicketLookup {
  id: string;
  event_id: string;
  owner_wallet: string;
  nft_asset_code: string;
}

async function lookupTicketByTokenId(
  tokenId: string,
  contractId: string,
): Promise<TicketLookup | null> {
  try {
    const result = await pool.query<TicketLookup>(
      `SELECT id, event_id, owner_wallet, nft_asset_code
       FROM tickets
       WHERE nft_asset_code = $1
          OR id = $1
       LIMIT 1`,
      [tokenId],
    );
    return result.rows[0] ?? null;
  } catch (err) {
    log.error({ err, tokenId }, 'Failed to lookup ticket by token ID');
    return null;
  }
}

async function lookupTicketByOwnerAndContract(
  ownerWallet: string,
  contractId: string,
): Promise<TicketLookup | null> {
  try {
    const result = await pool.query<TicketLookup>(
      `SELECT t.id, t.event_id, t.owner_wallet, t.nft_asset_code
       FROM tickets t
       JOIN ticket_tiers tt ON tt.id = t.tier_id
       WHERE t.owner_wallet = $1
         AND (tt.nft_contract_id = $2 OR t.nft_asset_issuer = $2)
       ORDER BY t.created_at DESC
       LIMIT 1`,
      [ownerWallet, contractId],
    );
    return result.rows[0] ?? null;
  } catch (err) {
    log.error({ err, ownerWallet, contractId }, 'Failed to lookup ticket by owner');
    return null;
  }
}

/**
 * Stop the event dispatcher.
 */
export async function stopEventDispatcher(): Promise<void> {
  if (isSubscribed) {
    const channels = Object.values(CHANNELS);
    await redisSub.unsubscribe(...channels);
    isSubscribed = false;
  }
  log.info('Event dispatcher stopped');
}
