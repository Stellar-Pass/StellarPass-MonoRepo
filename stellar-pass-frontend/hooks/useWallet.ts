"use client";

import { useState, useCallback, useEffect } from "react";
import { getWalletAdapter, getAvailableWallets, type WalletAdapter } from "@/lib/wallets";
import type { WalletType } from "@/lib/constants";

interface WalletState {
  connected: boolean;
  publicKey: string | null;
  walletType: WalletType | null;
  loading: boolean;
  error: string | null;
}

interface UseWalletReturn extends WalletState {
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  availableWallets: { id: WalletType; name: string; installed: boolean }[];
  refreshWallets: () => Promise<void>;
}

const STORAGE_KEY = "stellar-pass-wallet";

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    walletType: null,
    loading: false,
    error: null,
  });
  const [availableWallets, setAvailableWallets] = useState<
    { id: WalletType; name: string; installed: boolean }[]
  >([]);
  const [adapter, setAdapter] = useState<WalletAdapter | null>(null);

  const refreshWallets = useCallback(async () => {
    const wallets = await getAvailableWallets();
    setAvailableWallets(wallets);
  }, []);

  useEffect(() => {
    refreshWallets();

    // Restore saved wallet connection
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { walletType, publicKey } = JSON.parse(saved);
        setState((prev) => ({
          ...prev,
          connected: true,
          publicKey,
          walletType,
        }));
        setAdapter(getWalletAdapter(walletType));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [refreshWallets]);

  const connect = useCallback(async (walletType: WalletType) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const walletAdapter = getWalletAdapter(walletType);
      const installed = await walletAdapter.isInstalled();
      if (!installed) {
        throw new Error(`${walletAdapter.name} is not installed. Please install it and try again.`);
      }

      const publicKey = await walletAdapter.connect();
      setAdapter(walletAdapter);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ walletType, publicKey })
      );

      setState({
        connected: true,
        publicKey,
        walletType,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to connect wallet",
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (adapter) {
      await adapter.disconnect();
    }
    localStorage.removeItem(STORAGE_KEY);
    setAdapter(null);
    setState({
      connected: false,
      publicKey: null,
      walletType: null,
      loading: false,
      error: null,
    });
  }, [adapter]);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!adapter) {
        throw new Error("No wallet connected");
      }
      return await adapter.signTransaction(xdr);
    },
    [adapter]
  );

  return {
    ...state,
    connect,
    disconnect,
    signTransaction,
    availableWallets,
    refreshWallets,
  };
}
