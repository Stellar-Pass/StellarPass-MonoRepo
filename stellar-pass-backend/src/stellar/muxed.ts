import StellarSdk from 'stellar-sdk';
import { platformKeypair, NETWORK_PASSPHRASE, horizonServer } from './sep10';

/**
 * Create a muxed account (M-address) for a given buyer.
 * This allows multiplexed payments for ticket purchases.
 */
export function createMuxedAccount(
  baseAddress: string,
  muxedId: bigint,
): string {
  const muxed = new StellarSdk.MuxedAccount(
    StellarSdk.Keypair.fromPublicKey(baseAddress),
    muxedId.toString(),
  );
  return muxed.accountId();
}

/**
 * Create a muxed account on the platform's base account.
 * Returns the M-address and the muxed ID.
 */
export async function createPlatformMuxedAccount(
  buyerWallet: string,
  sessionId: string,
): Promise<{ muxedAccount: string; muxedId: bigint }> {
  // Use a deterministic muxed ID derived from the session ID
  const hash = StellarSdk.hash(Buffer.from(sessionId, 'utf-8'));
  const muxedId = hash.readBigUInt64BE(0);

  const muxedAccount = createMuxedAccount(platformKeypair.publicKey(), muxedId);

  return { muxedAccount, muxedId };
}

/**
 * Decode a muxed account to get the base address and muxed ID.
 */
export function decodeMuxedAccount(
  muxedAddress: string,
): { baseAddress: string; muxedId: string } {
  const muxed = StellarSdk.MuxedAccount.fromAccountId(muxedAddress);
  return {
    baseAddress: muxed.baseAccount().accountId(),
    muxedId: muxed.id,
  };
}

/**
 * Generate a sequential muxed ID from a counter (stored in Redis).
 */
export async function getNextMuxedId(redis: {
  incr(key: string): Promise<number>;
}): Promise<bigint> {
  const counter = await redis.incr('muxed_id_counter');
  return BigInt(counter);
}

export { StellarSdk };
