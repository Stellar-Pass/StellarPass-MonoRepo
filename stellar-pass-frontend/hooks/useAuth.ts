"use client";

import { useState, useCallback, useEffect } from "react";
import { useWallet } from "./useWallet";
import api from "@/lib/api";

interface AuthState {
  authenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
}

const TOKEN_KEY = "stellar-pass-token";

export function useAuth(): UseAuthReturn {
  const { connected, publicKey, signTransaction } = useWallet();
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    token: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setState((prev) => ({
        ...prev,
        authenticated: true,
        token: savedToken,
      }));
    }
  }, []);

  useEffect(() => {
    if (!connected) {
      localStorage.removeItem(TOKEN_KEY);
      setState({
        authenticated: false,
        token: null,
        loading: false,
        error: null,
      });
    }
  }, [connected]);

  const login = useCallback(async () => {
    if (!connected || !publicKey) {
      setState((prev) => ({
        ...prev,
        error: "Please connect your wallet first",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Step 1: Get challenge transaction from server
      const challengeResponse = await api.getAuthChallenge(publicKey);
      if (challengeResponse.error || !challengeResponse.data) {
        throw new Error(challengeResponse.error || "Failed to get auth challenge");
      }

      const { transaction } = challengeResponse.data as { transaction: string };

      // Step 2: Sign the challenge transaction
      const signedTransaction = await signTransaction(transaction);

      // Step 3: Verify signed transaction and get JWT token
      const verifyResponse = await api.verifyAuth(signedTransaction);
      if (verifyResponse.error || !verifyResponse.data) {
        throw new Error(verifyResponse.error || "Failed to verify authentication");
      }

      const { token } = verifyResponse.data as { token: string };

      localStorage.setItem(TOKEN_KEY, token);

      setState({
        authenticated: true,
        token,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Authentication failed",
      }));
    }
  }, [connected, publicKey, signTransaction]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({
      authenticated: false,
      token: null,
      loading: false,
      error: null,
    });
  }, []);

  const getToken = useCallback(() => {
    return state.token;
  }, [state.token]);

  return {
    ...state,
    login,
    logout,
    getToken,
  };
}
