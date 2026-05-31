import StellarSdk from 'stellar-sdk';
import { platformKeypair, NETWORK_PASSPHRASE, horizonServer } from './sep10';

/**
 * Build and submit a payment transaction.
 */
export async function buildPayment(
  sourceSecret: string,
  destination: string,
  amount: string,
  asset: StellarSdk.Asset,
  memo?: string,
): Promise<string> {
  const sourceKeypair = StellarSdk.Keypair.fromSecret(sourceSecret);
  const sourceAccount = await horizonServer.loadAccount(sourceKeypair.publicKey());

  const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  txBuilder.addOperation(
    StellarSdk.Operation.payment({
      destination,
      asset,
      amount,
    }),
  );

  if (memo) {
    txBuilder.addMemo(StellarSdk.Memo.text(memo));
  }

  txBuilder.setTimeout(180);
  const transaction = txBuilder.build();
  transaction.sign(sourceKeypair);

  const result = await horizonServer.submitTransaction(transaction);
  return result.hash;
}

/**
 * Build a trustline transaction for a custom asset.
 */
export async function buildTrustline(
  accountSecret: string,
  assetCode: string,
  assetIssuer: string,
): Promise<string> {
  const keypair = StellarSdk.Keypair.fromSecret(accountSecret);
  const account = await horizonServer.loadAccount(keypair.publicKey());

  const asset = new StellarSdk.Asset(assetCode, assetIssuer);

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.changeTrust({
        asset,
        limit: '922337203685.4775807',
      }),
    )
    .setTimeout(180)
    .build();

  transaction.sign(keypair);
  const result = await horizonServer.submitTransaction(transaction);
  return result.hash;
}

/**
 * Build a Soroban invoke transaction (skeleton).
 */
export async function buildSorobanInvoke(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
): Promise<string> {
  const account = await horizonServer.loadAccount(platformKeypair.publicKey());

  const contract = new StellarSdk.Contract(contractId);

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(180)
    .build();

  transaction.sign(platformKeypair);
  const result = await horizonServer.submitTransaction(transaction);
  return result.hash;
}

/**
 * Get an asset object for a given code and issuer.
 */
export function getAsset(code: string, issuer: string): StellarSdk.Asset {
  return new StellarSdk.Asset(code, issuer);
}

/**
 * Build a raw transaction builder with the platform account.
 */
export async function getPlatformTxBuilder(): Promise<StellarSdk.TransactionBuilder> {
  const account = await horizonServer.loadAccount(platformKeypair.publicKey());
  return new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
}

export { StellarSdk };
