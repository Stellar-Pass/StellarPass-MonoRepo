import { IS_TESTNET, type WalletType } from "./constants";
import { networkPassphrase } from "./stellar";

export interface WalletAdapter {
  id: WalletType;
  name: string;
  isInstalled: () => Promise<boolean>;
  connect: () => Promise<string>;
  signTransaction: (xdr: string) => Promise<string>;
  disconnect: () => Promise<void>;
}

// Freighter
const freighterAdapter: WalletAdapter = {
  id: "freighter",
  name: "Freighter",
  isInstalled: async () => {
    return typeof window !== "undefined" && "freighter" in window;
  },
  connect: async () => {
    const freighter = (window as unknown as { freighter: { getPublicKey: () => Promise<string>; isConnected: () => Promise<boolean> } }).freighter;
    if (!freighter) throw new Error("Freighter is not installed");
    const publicKey = await freighter.getPublicKey();
    return publicKey;
  },
  signTransaction: async (xdr: string) => {
    const freighter = (window as unknown as { freighter: { signTransaction: (xdr: string, opts: { network: string }) => Promise<string> } }).freighter;
    if (!freighter) throw new Error("Freighter is not installed");
    return await freighter.signTransaction(xdr, {
      network: IS_TESTNET ? "TESTNET" : "PUBLIC",
    });
  },
  disconnect: async () => {
    // Freighter doesn't have a disconnect method
  },
};

// Albedo
const albedoAdapter: WalletAdapter = {
  id: "albedo",
  name: "Albedo",
  isInstalled: async () => {
    return typeof window !== "undefined" && "albedo" in window;
  },
  connect: async () => {
    const albedo = (window as unknown as { albedo: { publicKey: (opts: { network: string }) => Promise<{ pubkey: string }> } }).albedo;
    if (!albedo) throw new Error("Albedo is not installed");
    const result = await albedo.publicKey({ network: IS_TESTNET ? "testnet" : "public" });
    return result.pubkey;
  },
  signTransaction: async (xdr: string) => {
    const albedo = (window as unknown as { albedo: { tx: (opts: { xdr: string; network: string; submit: boolean }) => Promise<{ signed_envelope_xdr: string }> } }).albedo;
    if (!albedo) throw new Error("Albedo is not installed");
    const result = await albedo.tx({
      xdr,
      network: IS_TESTNET ? "testnet" : "public",
      submit: false,
    });
    return result.signed_envelope_xdr;
  },
  disconnect: async () => {
    // Albedo doesn't have a disconnect method
  },
};

// xBull
const xbullAdapter: WalletAdapter = {
  id: "xbull",
  name: "xBull",
  isInstalled: async () => {
    return typeof window !== "undefined" && "xBullSDK" in window;
  },
  connect: async () => {
    const xbull = (window as unknown as { xBullSDK: { connect: () => Promise<{ publicKey: string }> } }).xBullSDK;
    if (!xbull) throw new Error("xBull is not installed");
    const result = await xbull.connect();
    return result.publicKey;
  },
  signTransaction: async (xdr: string) => {
    const xbull = (window as unknown as { xBullSDK: { signTransaction: (xdr: string, opts: { network: string }) => Promise<string> } }).xBullSDK;
    if (!xbull) throw new Error("xBull is not installed");
    return await xbull.signTransaction(xdr, {
      network: networkPassphrase,
    });
  },
  disconnect: async () => {
    const xbull = (window as unknown as { xBullSDK: { disconnect: () => Promise<void> } }).xBullSDK;
    if (xbull) {
      await xbull.disconnect();
    }
  },
};

// Lobstr
const lobstrAdapter: WalletAdapter = {
  id: "lobstr",
  name: "Lobstr",
  isInstalled: async () => {
    return typeof window !== "undefined" && "lobstr" in window;
  },
  connect: async () => {
    const lobstr = (window as unknown as { lobstr: { connect: () => Promise<{ publicKey: string }> } }).lobstr;
    if (!lobstr) throw new Error("Lobstr is not installed");
    const result = await lobstr.connect();
    return result.publicKey;
  },
  signTransaction: async (xdr: string) => {
    const lobstr = (window as unknown as { lobstr: { signTransaction: (xdr: string) => Promise<string> } }).lobstr;
    if (!lobstr) throw new Error("Lobstr is not installed");
    return await lobstr.signTransaction(xdr);
  },
  disconnect: async () => {
    // Lobstr doesn't have a disconnect method
  },
};

const adapters: Record<WalletType, WalletAdapter> = {
  freighter: freighterAdapter,
  albedo: albedoAdapter,
  xbull: xbullAdapter,
  lobstr: lobstrAdapter,
};

export function getWalletAdapter(walletType: WalletType): WalletAdapter {
  const adapter = adapters[walletType];
  if (!adapter) {
    throw new Error(`Unknown wallet type: ${walletType}`);
  }
  return adapter;
}

export async function getAvailableWallets(): Promise<{ id: WalletType; name: string; installed: boolean }[]> {
  const results = await Promise.all(
    Object.values(adapters).map(async (adapter) => ({
      id: adapter.id,
      name: adapter.name,
      installed: await adapter.isInstalled(),
    }))
  );
  return results;
}
