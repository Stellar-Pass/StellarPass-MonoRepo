import StellarSdk from 'stellar-sdk';
import { redis, getLastProcessedLedger, setLastProcessedLedger, CHANNELS } from '../db/redis';
import { getContractEvents, type ContractEvent } from '../stellar/soroban';
import { createChildLogger } from '../utils/logger';
import { config } from '../utils/config';

const log = createChildLogger('contract-stream');

// Contract IDs to watch — populated from DB or config
const watchedContracts = new Map<string, ContractType>();

type ContractType = 'ticket' | 'poap';

// Event type constants (from Soroban contract events)
const EVENT_TRANSFER = 'transfer';
const EVENT_FREEZE = 'freeze';
const EVENT_CLAWBACK = 'clawback';
const EVENT_MINT = 'mint';

// Redis key prefix for each contract's ledger cursor
function ledgerKey(contractId: string): string {
  return `contract:${contractId}`;
}

// Polling interval reference
let pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Register a contract to watch.
 */
export function watchContract(contractId: string, type: ContractType): void {
  watchedContracts.set(contractId, type);
  log.info({ contractId, type }, 'Registered contract for watching');
}

/**
 * Start polling for contract events.
 */
export async function startContractEventProcessor(): Promise<void> {
  if (watchedContracts.size === 0) {
    log.info('No contracts registered — contract event processor idle');
    return;
  }

  log.info({ contractCount: watchedContracts.size }, 'Starting contract event processor');

  // Do an initial poll immediately
  await pollAllContracts();

  // Then poll at the configured interval
  pollTimer = setInterval(() => {
    pollAllContracts().catch((err) => {
      log.error({ err }, 'Error during contract event poll');
    });
  }, config.indexer.pollIntervalMs);
}

/**
 * Poll all registered contracts for new events.
 */
async function pollAllContracts(): Promise<void> {
  for (const [contractId, contractType] of watchedContracts) {
    try {
      await pollContract(contractId, contractType);
    } catch (err) {
      log.error({ err, contractId, contractType }, 'Failed to poll contract');
    }
  }
}

/**
 * Poll a single contract for events since the last processed ledger.
 */
async function pollContract(contractId: string, contractType: ContractType): Promise<void> {
  const lastLedger = await getLastProcessedLedger(ledgerKey(contractId));

  // If we have no cursor, start from the latest ledger (don't replay history)
  let startLedger: number;
  if (lastLedger === 0) {
    // Fetch current ledger from Soroban RPC
    try {
      const latest = await getContractEvents(contractId, 0);
      startLedger = latest.latestLedger;
      await setLastProcessedLedger(ledgerKey(contractId), startLedger);
      log.info({ contractId, startLedger }, 'Initialized contract event cursor');
      return;
    } catch (err) {
      log.error({ err, contractId }, 'Failed to initialize contract event cursor');
      return;
    }
  }

  startLedger = lastLedger + 1;

  const { events, latestLedger } = await getContractEvents(contractId, startLedger);

  if (events.length === 0) {
    // No new events — update cursor to latest
    if (latestLedger > lastLedger) {
      await setLastProcessedLedger(ledgerKey(contractId), latestLedger);
    }
    return;
  }

  log.info({ contractId, contractType, eventCount: events.length }, 'Processing contract events');

  for (const event of events) {
    await processContractEvent(event, contractType);
  }

  // Update cursor to the latest ledger we've seen
  await setLastProcessedLedger(ledgerKey(contractId), latestLedger);
}

/**
 * Route a contract event to the appropriate handler.
 */
async function processContractEvent(event: ContractEvent, contractType: ContractType): Promise<void> {
  const eventType = extractEventType(event);

  if (!eventType) {
    log.debug({ topic: event.topic, contractId: event.contractId }, 'Unknown event topic — skipping');
    return;
  }

  log.info(
    {
      eventType,
      contractType,
      txHash: event.txHash,
      ledger: event.ledger,
      contractId: event.contractId,
    },
    'Processing contract event',
  );

  switch (eventType) {
    case EVENT_TRANSFER:
      await handleTransferEvent(event);
      break;
    case EVENT_FREEZE:
      await handleFreezeEvent(event);
      break;
    case EVENT_CLAWBACK:
      await handleClawbackEvent(event);
      break;
    case EVENT_MINT:
      await handleMintEvent(event, contractType);
      break;
    default:
      log.debug({ eventType }, 'Unhandled event type');
  }
}

/**
 * Extract the event type from the topic array.
 * Soroban events have topic as an array of ScVal strings.
 */
function extractEventType(event: ContractEvent): string | null {
  if (!event.topic || event.topic.length === 0) return null;
  // First element of topic is the event type (as a symbol)
  const raw = event.topic[0];
  // The topic value might be a base64-encoded ScVal or a plain string
  // Depending on SDK version, we parse accordingly
  if (typeof raw === 'string') {
    // Try to decode if it looks like base64-encoded XDR
    try {
      const decoded = decodeScValSymbol(raw);
      return decoded ?? raw;
    } catch {
      return raw;
    }
  }
  return null;
}

/**
 * Attempt to decode a base64-encoded ScVal Symbol to a string.
 */
function decodeScValSymbol(encoded: string): string | null {
  try {
    const xdr = StellarSdk.xdr.ScVal.fromXDR(encoded, 'base64');
    if (xdr.switch() === StellarSdk.xdr.ScValType.scvSymbol()) {
      return xdr.sym().toString();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Handle a transfer event: ticket moved from one owner to another.
 */
async function handleTransferEvent(event: ContractEvent): Promise<void> {
  const value = event.value as Record<string, unknown> | undefined;
  if (!value) {
    log.warn({ txHash: event.txHash }, 'Transfer event missing value');
    return;
  }

  const from = (value.from ?? value.seller) as string | undefined;
  const to = (value.to ?? value.buyer) as string | undefined;
  const tokenId = (value.token_id ?? value.id) as string | number | undefined;

  if (!from || !to || tokenId === undefined) {
    log.warn({ value, txHash: event.txHash }, 'Transfer event missing required fields');
    return;
  }

  const eventData = {
    from: String(from),
    to: String(to),
    tokenId: String(tokenId),
    txHash: event.txHash,
    contractId: event.contractId,
    ledger: event.ledger,
  };

  await redis.publish(CHANNELS.NFT_TRANSFERRED, JSON.stringify(eventData));
  log.info(eventData, 'Published nft.transferred event');
}

/**
 * Handle a freeze event: ticket frozen by organizer.
 */
async function handleFreezeEvent(event: ContractEvent): Promise<void> {
  const value = event.value as Record<string, unknown> | undefined;
  const tokenId = (value?.token_id ?? value?.id) as string | number | undefined;

  if (tokenId === undefined) {
    log.warn({ value, txHash: event.txHash }, 'Freeze event missing token ID');
    return;
  }

  const eventData = {
    tokenId: String(tokenId),
    txHash: event.txHash,
    contractId: event.contractId,
    ledger: event.ledger,
  };

  await redis.publish(CHANNELS.NFT_FROZEN, JSON.stringify(eventData));
  log.info(eventData, 'Published nft.frozen event');
}

/**
 * Handle a clawback event: ticket reclaimed by organizer.
 */
async function handleClawbackEvent(event: ContractEvent): Promise<void> {
  const value = event.value as Record<string, unknown> | undefined;
  const tokenId = (value?.token_id ?? value?.id) as string | number | undefined;

  if (tokenId === undefined) {
    log.warn({ value, txHash: event.txHash }, 'Clawback event missing token ID');
    return;
  }

  const eventData = {
    tokenId: String(tokenId),
    txHash: event.txHash,
    contractId: event.contractId,
    ledger: event.ledger,
  };

  await redis.publish(CHANNELS.NFT_CLAWED_BACK, JSON.stringify(eventData));
  log.info(eventData, 'Published nft.clawed_back event');
}

/**
 * Handle a mint event: new NFT minted (ticket or POAP).
 */
async function handleMintEvent(event: ContractEvent, contractType: ContractType): Promise<void> {
  const value = event.value as Record<string, unknown> | undefined;
  const tokenId = (value?.token_id ?? value?.id) as string | number | undefined;
  const to = value?.to as string | undefined;

  if (tokenId === undefined || !to) {
    log.warn({ value, txHash: event.txHash }, 'Mint event missing required fields');
    return;
  }

  const eventData = {
    tokenId: String(tokenId),
    to: String(to),
    contractType,
    txHash: event.txHash,
    contractId: event.contractId,
    ledger: event.ledger,
    metadata: value?.metadata,
  };

  if (contractType === 'poap') {
    await redis.publish(CHANNELS.POAP_MINTED, JSON.stringify(eventData));
    log.info(eventData, 'Published poap.minted event');
  } else {
    // Ticket mint — this is the completion of a purchase flow
    await redis.publish(CHANNELS.NFT_TRANSFERRED, JSON.stringify({
      from: 'mint',
      to: String(to),
      tokenId: String(tokenId),
      txHash: event.txHash,
      contractId: event.contractId,
      ledger: event.ledger,
    }));
    log.info(eventData, 'Published nft.transferred (mint) event');
  }
}

/**
 * Stop the contract event poller.
 */
export function stopContractEventProcessor(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  log.info('Contract event processor stopped');
}
