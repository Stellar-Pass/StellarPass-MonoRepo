import {
  Horizon,
  Keypair,
  Transaction,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Asset,
  Memo,
} from "@stellar/stellar-sdk";
import { HORIZON_URL, IS_TESTNET, STELLAR_PASS_ISSUER } from "./constants";

export const server = new Horizon.Server(HORIZON_URL);

export const networkPassphrase = IS_TESTNET ? Networks.TESTNET : Networks.PUBLIC;

export async function getAccount(publicKey: string) {
  try {
    return await server.loadAccount(publicKey);
  } catch (error) {
    throw new Error(`Failed to load account: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function buildPaymentTransaction(
  sourcePublicKey: string,
  destination: string,
  amount: string,
  asset: Asset = Asset.native(),
  memo?: string
): Promise<string> {
  const account = await getAccount(sourcePublicKey);

  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  });

  txBuilder.addOperation(
    Operation.payment({
      destination,
      asset,
      amount,
    })
  );

  if (memo) {
    txBuilder.addMemo(Memo.text(memo));
  }

  txBuilder.setTimeout(180);

  const transaction = txBuilder.build();
  return transaction.toEnvelope().toXDR("base64");
}

export async function buildTicketMintTransaction(
  sourcePublicKey: string,
  eventId: string,
  tierId: string,
  ticketAssetCode: string
): Promise<string> {
  const account = await getAccount(sourcePublicKey);

  const txBuilder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  });

  const ticketAsset = new Asset(ticketAssetCode, STELLAR_PASS_ISSUER);

  txBuilder.addOperation(
    Operation.changeTrust({
      asset: ticketAsset,
    })
  );

  txBuilder.setTimeout(180);

  const transaction = txBuilder.build();
  return transaction.toEnvelope().toXDR("base64");
}

export async function submitTransaction(signedXdr: string): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
  try {
    const transaction = new Transaction(signedXdr, networkPassphrase);
    return await server.submitTransaction(transaction);
  } catch (error: unknown) {
    const horizonError = error as { response?: { data?: { extras?: { result_codes?: Record<string, unknown> } } } };
    if (horizonError.response?.data?.extras?.result_codes) {
      throw new Error(
        `Transaction failed: ${JSON.stringify(horizonError.response.data.extras.result_codes)}`
      );
    }
    throw new Error(`Failed to submit transaction: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function getAccountBalances(publicKey: string) {
  try {
    const account = await getAccount(publicKey);
    return account.balances.map((balance) => ({
      assetType: balance.asset_type,
      assetCode: "asset_code" in balance ? balance.asset_code : "XLM",
      assetIssuer: "asset_issuer" in balance ? balance.asset_issuer : "",
      balance: balance.balance,
    }));
  } catch {
    return [];
  }
}

export async function checkAccountExists(publicKey: string): Promise<boolean> {
  try {
    await server.loadAccount(publicKey);
    return true;
  } catch {
    return false;
  }
}

export function isValidPublicKey(key: string): boolean {
  try {
    Keypair.fromPublicKey(key);
    return true;
  } catch {
    return false;
  }
}
