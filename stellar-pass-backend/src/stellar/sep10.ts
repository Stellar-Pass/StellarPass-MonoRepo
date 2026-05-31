import StellarSdk from 'stellar-sdk';
import crypto from 'crypto';

const server = new StellarSdk.Horizon.Server(
  process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
);

const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK === 'mainnet'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

const platformKeypair = StellarSdk.Keypair.fromSecret(
  process.env.STELLAR_PLATFORM_SECRET_KEY || '',
);

const HOME_DOMAIN = process.env.HOME_DOMAIN || 'stellarpass.io';
const AUTH_TIMEOUT = 300; // 5 minutes

/**
 * Build a SEP-10 challenge transaction.
 * Returns the base64-encoded unsigned transaction XDR.
 */
export async function buildChallenge(
  clientAccount: string,
): Promise<string> {
  const account = await server.loadAccount(platformKeypair.publicKey());

  const challenge = StellarSdk.Utils.buildChallengeTx(
    account,
    clientAccount,
    HOME_DOMAIN,
    NETWORK_PASSPHRASE,
    AUTH_TIMEOUT,
    undefined,
    [StellarSdk.Memo.none()],
  );

  return challenge;
}

/**
 * Verify a signed SEP-10 challenge transaction and extract the client account.
 * Returns the client's public key (G-address) if valid.
 */
export async function verifyChallenge(
  signedTransactionXDR: string,
): Promise<string> {
  const { clientAccountID } = StellarSdk.Utils.readChallengeTx(
    signedTransactionXDR,
    platformKeypair.publicKey(),
    NETWORK_PASSPHRASE,
    HOME_DOMAIN,
  );

  // Verify the transaction on-chain to check account existence
  await server.loadAccount(clientAccountID);

  return clientAccountID;
}

/**
 * Build a SEP-10 challenge with additional memo for multiplexing.
 */
export async function buildChallengeWithMemo(
  clientAccount: string,
  memo: string,
): Promise<string> {
  const account = await server.loadAccount(platformKeypair.publicKey());

  const challenge = StellarSdk.Utils.buildChallengeTx(
    account,
    clientAccount,
    HOME_DOMAIN,
    NETWORK_PASSPHRASE,
    AUTH_TIMEOUT,
    undefined,
    [StellarSdk.Memo.text(memo)],
  );

  return challenge;
}

export { platformKeypair, NETWORK_PASSPHRASE, server as horizonServer };
