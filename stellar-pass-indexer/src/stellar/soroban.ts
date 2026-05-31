import StellarSdk from 'stellar-sdk';
import { config } from '../utils/config';
import { createChildLogger } from '../utils/logger';

const log = createChildLogger('soroban');

// Soroban RPC client
export const sorobanServer = new StellarSdk.SorobanRpc.Server(config.stellar.sorobanRpcUrl);

const networkPassphrase =
  config.stellar.network === 'public'
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

// --- Types ---

export interface ContractEvent {
  type: string;
  ledger: number;
  ledgerClosedAt: string;
  contractId: string;
  id: number;
  pagingToken: string;
  topic: string[];
  value: unknown;
  inSuccessfulContractCall: boolean;
  txHash: string;
}

export interface GetEventsResult {
  events: ContractEvent[];
  latestLedger: number;
}

// --- Contract event fetching ---

/**
 * Get contract events since a given ledger.
 * Uses the Soroban RPC `getEvents` method.
 */
export async function getContractEvents(
  contractId: string,
  startLedger: number,
  filters?: { type?: string },
): Promise<GetEventsResult> {
  try {
    const result = await sorobanServer.getEvents({
      startLedger,
      filters: [
        {
          contractIds: [contractId],
          ...(filters?.type ? { topics: [[filters.type]]] : {}),
        },
      ],
      limit: 100,
    });

    log.debug(
      { contractId, startLedger, eventCount: result.events.length, latestLedger: result.latestLedger },
      'Fetched contract events',
    );

    return {
      events: result.events as ContractEvent[],
      latestLedger: result.latestLedger,
    };
  } catch (err) {
    log.error({ err, contractId, startLedger }, 'Failed to fetch contract events');
    throw err;
  }
}

/**
 * Build and encode a Soroban contract invocation transaction.
 * The caller must sign and submit it.
 */
export async function buildContractInvoke(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  sourceAccount: string,
  signerSecret: string,
): Promise<string> {
  try {
    const account = await sorobanServer.getAccount(sourceAccount);
    const contract = new StellarSdk.Contract(contractId);

    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    // Prepare the transaction (simulates it)
    const prepared = await sorobanServer.prepareTransaction(tx);
    const signed = StellarSdk.Keypair.fromSecret(signerSecret);

    prepared.sign(signed);

    return prepared.toXDR();
  } catch (err) {
    log.error({ err, contractId, method }, 'Failed to build contract invocation');
    throw err;
  }
}

/**
 * Invoke a contract function and submit the transaction.
 * Returns the transaction hash.
 */
export async function invokeContract(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  sourceAccount: string,
  signerSecret: string,
): Promise<string> {
  const xdr = await buildContractInvoke(contractId, method, args, sourceAccount, signerSecret);

  const result = await sorobanServer.sendTransaction(
    StellarSdk.TransactionBuilder.fromXDR(xdr, networkPassphrase),
  );

  if (result.status === 'ERROR') {
    log.error({ result, contractId, method }, 'Contract invocation failed');
    throw new Error(`Contract invocation failed: ${JSON.stringify(result.errorResult)}`);
  }

  log.info({ hash: result.hash, contractId, method }, 'Contract invocation submitted');
  return result.hash;
}

/**
 * Wait for a transaction to be confirmed.
 */
export async function waitForTransaction(
  hash: string,
  timeoutMs = 30_000,
): Promise<StellarSdk.SorobanRpc.Api.GetTransactionResponse> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await sorobanServer.getTransaction(hash);

    if (result.status === 'SUCCESS') {
      log.info({ hash }, 'Transaction confirmed');
      return result;
    }

    if (result.status === 'FAILED') {
      log.error({ hash, result }, 'Transaction failed');
      throw new Error(`Transaction ${hash} failed`);
    }

    // PENDING — wait and poll again
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`Transaction ${hash} timed out after ${timeoutMs}ms`);
}
