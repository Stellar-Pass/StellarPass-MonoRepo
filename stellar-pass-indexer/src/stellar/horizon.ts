import StellarSdk from 'stellar-sdk';
import { config } from '../utils/config';
import { createChildLogger } from '../utils/logger';

const log = createChildLogger('horizon');

// Build the Horizon server instance
export const horizonServer = new StellarSdk.Horizon.Server(config.stellar.horizonUrl);

// Network passphrase
const networkPassphrase =
  config.stellar.network === 'public'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

export { networkPassphrase };

// --- Types ---

export interface PaymentRecord {
  id: string;
  type: string;
  amount: string;
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  from: string;
  to: string;
  transaction_hash: string;
  created_at: string;
  paging_token: string;
}

export interface StreamHandle {
  close: () => void;
}

// --- Streaming ---

/**
 * Stream payments for a single muxed account.
 * Returns a handle to close the stream.
 * Calls `onPayment` for each new payment record.
 * `cursor` is the paging token to resume from (stored in Redis).
 */
export function streamPaymentsForAccount(
  muxedAccount: string,
  onPayment: (payment: PaymentRecord) => void,
  onError: (err: Error) => void,
  cursor?: string,
): StreamHandle {
  const callBuilder = horizonServer
    .payments()
    .forAccount(muxedAccount)
    .order('asc');

  if (cursor) {
    callBuilder.cursor(cursor);
  }

  log.info({ muxedAccount, cursor: cursor ?? 'now' }, 'Starting payment stream');

  const es = callBuilder.stream({
    onmessage: (payment: PaymentRecord) => {
      log.debug(
        { paymentId: payment.id, type: payment.type, from: payment.from, amount: payment.amount },
        'Payment received',
      );
      onPayment(payment);
    },
    onerror: (err: Error) => {
      log.error({ err, muxedAccount }, 'Payment stream error');
      onError(err);
    },
  });

  return {
    close: () => {
      if (typeof es === 'object' && es !== null && 'close' in es) {
        (es as EventSource).close();
      }
      log.info({ muxedAccount }, 'Payment stream closed');
    },
  };
}

// --- Rate-limit aware request helper ---

const RATE_LIMIT_DELAY_MS = 1000;
let lastRequestTime = 0;

async function rateLimitedFetch<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_DELAY_MS) {
    await sleep(RATE_LIMIT_DELAY_MS - elapsed);
  }
  lastRequestTime = Date.now();

  try {
    return await fn();
  } catch (err: unknown) {
    if (isHorizonRateLimitError(err)) {
      log.warn('Horizon rate limit hit, backing off 5s');
      await sleep(5000);
      lastRequestTime = Date.now();
      return fn();
    }
    throw err;
  }
}

function isHorizonRateLimitError(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { status?: number } }).response;
    return response?.status === 429;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Account info ---

export async function getAccountDetails(accountId: string) {
  return rateLimitedFetch(() => horizonServer.accounts().accountId(accountId).call());
}

// --- Transaction submission ---

export async function submitTransaction(signedXdr: string) {
  const envelope = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  return rateLimitedFetch(() => horizonServer.submitTransaction(envelope));
}
