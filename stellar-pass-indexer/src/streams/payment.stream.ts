import { redis, getCursor, setCursor, CHANNELS } from '../db/redis';
import { getActiveMuxedAccounts, markSessionExpired, type ActiveMuxedAccount } from '../db/writes';
import {
  streamPaymentsForAccount,
  type PaymentRecord,
  type StreamHandle,
} from '../stellar/horizon';
import { createChildLogger } from '../utils/logger';
import { config } from '../utils/config';

const log = createChildLogger('payment-stream');

// How we identify a muxed account stream cursor in Redis
function cursorKey(muxedAccount: string): string {
  return `payment:${muxedAccount}`;
}

// Active stream handles keyed by muxed account
const activeStreams = new Map<string, StreamHandle>();

// The set of muxed accounts we are currently watching
const watchedAccounts = new Map<string, ActiveMuxedAccount>();

/**
 * Start payment streams for all currently active (pending) sessions.
 * Called on startup and periodically to pick up new sessions.
 */
export async function startPaymentStreamProcessor(): Promise<void> {
  log.info('Starting payment stream processor');

  await refreshStreams();
  log.info('Initial payment streams established');
}

/**
 * Refresh the set of streams.
 * Opens new streams for new sessions, closes streams for expired/completed ones.
 */
export async function refreshStreams(): Promise<void> {
  let accounts: ActiveMuxedAccount[];
  try {
    accounts = await getActiveMuxedAccounts();
  } catch (err) {
    log.error({ err }, 'Failed to refresh muxed accounts');
    return;
  }

  const currentMuxedSet = new Set(accounts.map((a) => a.muxed_account));
  const newAccounts: ActiveMuxedAccount[] = [];

  // Close streams for accounts no longer active
  for (const [muxed, handle] of activeStreams) {
    if (!currentMuxedSet.has(muxed)) {
      handle.close();
      activeStreams.delete(muxed);
      watchedAccounts.delete(muxed);
      log.info({ muxed }, 'Closed payment stream for inactive session');
    }
  }

  // Open streams for new accounts
  for (const account of accounts) {
    if (!activeStreams.has(account.muxed_account)) {
      newAccounts.push(account);
    }
  }

  if (newAccounts.length === 0) {
    log.debug({ activeCount: activeStreams.size }, 'No new streams to open');
    return;
  }

  for (const account of newAccounts) {
    await openStreamForAccount(account);
  }

  log.info(
    { newStreams: newAccounts.length, totalActive: activeStreams.size },
    'Payment streams refreshed',
  );
}

async function openStreamForAccount(account: ActiveMuxedAccount): Promise<void> {
  const { muxed_account: muxedAccount } = account;

  // Load cursor from Redis for crash recovery
  const cursor = await getCursor(cursorKey(muxedAccount));

  watchedAccounts.set(muxedAccount, account);

  const handle = streamPaymentsForAccount(
    muxedAccount,
    (payment: PaymentRecord) => {
      handlePayment(payment, account).catch((err) => {
        log.error({ err, muxedAccount, paymentId: payment.id }, 'Error handling payment');
      });
    },
    (err: Error) => {
      log.error({ err, muxedAccount }, 'Stream error — will be retried on next refresh');
      activeStreams.delete(muxedAccount);
    },
    cursor ?? undefined,
  );

  activeStreams.set(muxedAccount, handle);
}

/**
 * Handle an incoming payment on a muxed account.
 * Validates amount/asset, then publishes a 'payment.confirmed' event.
 */
async function handlePayment(
  payment: PaymentRecord,
  session: ActiveMuxedAccount,
): Promise<void> {
  // Only process incoming payments (type "payment")
  if (payment.type !== 'payment') {
    log.debug({ type: payment.type, id: payment.id }, 'Skipping non-payment record');
    await saveCursor(session.muxed_account, payment.paging_token);
    return;
  }

  // Validate the payment is incoming to our muxed account
  if (payment.to !== session.muxed_account) {
    log.debug({ to: payment.to, expected: session.muxed_account }, 'Payment not addressed to session muxed account');
    await saveCursor(session.muxed_account, payment.paging_token);
    return;
  }

  // Validate amount matches the session amount (within small tolerance for rounding)
  const paymentAmount = parseFloat(payment.amount);
  const expectedAmount = session.amount;
  const tolerance = 0.0000001; // 7 decimal places (Stellar precision)

  if (Math.abs(paymentAmount - expectedAmount) > tolerance) {
    log.warn(
      { paymentAmount, expectedAmount, sessionId: session.id },
      'Payment amount mismatch — ignoring',
    );
    await saveCursor(session.muxed_account, payment.paging_token);
    return;
  }

  // Validate asset matches
  const paymentAsset = formatAsset(payment);
  if (paymentAsset !== session.asset) {
    log.warn(
      { paymentAsset, expectedAsset: session.asset, sessionId: session.id },
      'Payment asset mismatch — ignoring',
    );
    await saveCursor(session.muxed_account, payment.paging_token);
    return;
  }

  // Payment confirmed — publish event
  log.info(
    {
      sessionId: session.id,
      txHash: payment.transaction_hash,
      amount: payment.amount,
      asset: paymentAsset,
    },
    'Payment confirmed for session',
  );

  const eventData = {
    sessionId: session.id,
    txHash: payment.transaction_hash,
    amount: paymentAmount,
    asset: paymentAsset,
    buyerWallet: session.buyer_wallet,
    eventId: session.event_id,
    tierId: session.tier_id,
  };

  await redis.publish(CHANNELS.PAYMENT_CONFIRMED, JSON.stringify(eventData));

  // Save cursor after successful processing
  await saveCursor(session.muxed_account, payment.paging_token);
}

async function saveCursor(muxedAccount: string, cursor: string): Promise<void> {
  try {
    await setCursor(cursorKey(muxedAccount), cursor);
  } catch (err) {
    log.error({ err, muxedAccount, cursor }, 'Failed to save cursor');
  }
}

function formatAsset(payment: PaymentRecord): string {
  if (payment.asset_type === 'native') {
    return 'XLM';
  }
  return `${payment.asset_code}:${payment.asset_issuer}`;
}

/**
 * Stop all active payment streams.
 */
export function stopPaymentStreams(): void {
  log.info({ count: activeStreams.size }, 'Stopping all payment streams');
  for (const [muxed, handle] of activeStreams) {
    handle.close();
    log.debug({ muxed }, 'Closed payment stream');
  }
  activeStreams.clear();
  watchedAccounts.clear();
}

/**
 * Periodically expire sessions that have passed their timeout.
 */
export async function expireStaleSessions(): Promise<void> {
  const now = new Date();
  for (const [muxed, session] of watchedAccounts) {
    if (new Date(session.expires_at) < now) {
      await markSessionExpired(session.id);
      watchedAccounts.delete(muxed);
      const handle = activeStreams.get(muxed);
      if (handle) {
        handle.close();
        activeStreams.delete(muxed);
      }
      log.info({ sessionId: session.id, muxed }, 'Session expired and stream closed');
    }
  }
}
