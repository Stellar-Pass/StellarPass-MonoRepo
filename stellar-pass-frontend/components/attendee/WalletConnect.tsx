"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ExternalLink,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn, truncateAddress } from "@/lib/utils";
import { useWallet } from "@/hooks/useWallet";
import { getAvailableWallets } from "@/lib/wallets";
import type { WalletType } from "@/lib/constants";

interface WalletConnectProps {
  onConnect?: (publicKey: string) => void;
  required?: boolean;
  compact?: boolean;
}

const walletDescriptions: Record<WalletType, string> = {
  freighter: "Official Stellar browser extension",
  albedo: "Web-based Stellar wallet",
  xbull: "Mobile & browser Stellar wallet",
  lobstr: "Popular mobile Stellar wallet",
};

export function WalletConnect({
  onConnect,
  required = true,
  compact = false,
}: WalletConnectProps) {
  const {
    connected,
    publicKey,
    walletType,
    loading,
    error,
    connect,
    disconnect,
  } = useWallet();
  const [wallets, setWallets] = useState<
    { id: WalletType; name: string; installed: boolean }[]
  >([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkWallets = async () => {
      const available = await getAvailableWallets();
      setWallets(available);
      setChecking(false);
    };
    checkWallets();
  }, []);

  useEffect(() => {
    if (connected && publicKey && onConnect) {
      onConnect(publicKey);
    }
  }, [connected, publicKey, onConnect]);

  const handleConnect = async (walletId: WalletType) => {
    await connect(walletId);
  };

  // Connected state
  if (connected && publicKey) {
    return (
      <Card className={cn(compact && "border-0 shadow-none")}>
        <CardContent className={cn("p-4", compact && "p-2")}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-50 dark:bg-success-950">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Connected
              </p>
              <p className="text-xs text-gray-500 font-mono truncate">
                {truncateAddress(publicKey, 8)}
              </p>
              <p className="text-[10px] text-gray-400 capitalize">
                via {walletType}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact mode - just show connect button
  if (compact) {
    return (
      <Button
        onClick={() => wallets.length > 0 && handleConnect(wallets[0].id)}
        loading={loading}
        className="w-full"
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stellar-50 dark:bg-stellar-950 mx-auto mb-4">
            <Wallet className="h-7 w-7 text-stellar-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Connect Your Wallet
          </h2>
          <p className="text-sm text-gray-500">
            {required
              ? "A Stellar wallet is required to purchase tickets"
              : "Connect a wallet to manage your tickets"}
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 rounded-xl bg-danger-50 border border-danger-200 dark:bg-danger-950 dark:border-danger-800"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-danger-500" />
                <p className="text-sm text-danger-700 dark:text-danger-300">
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallet Options */}
        {checking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {wallets.map((wallet) => {
              const isInstalled = wallet.installed;

              return (
                <motion.button
                  key={wallet.id}
                  whileHover={isInstalled ? { scale: 1.01 } : undefined}
                  whileTap={isInstalled ? { scale: 0.99 } : undefined}
                  onClick={() => isInstalled && handleConnect(wallet.id)}
                  disabled={!isInstalled || loading}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    isInstalled
                      ? "border-gray-200 hover:border-stellar-300 hover:bg-stellar-50/50 dark:border-gray-700 dark:hover:border-stellar-700 dark:hover:bg-stellar-950/30 cursor-pointer"
                      : "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 opacity-60 cursor-not-allowed"
                  )}
                >
                  {/* Wallet Icon */}
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      isInstalled
                        ? "bg-white shadow-sm dark:bg-gray-800"
                        : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    <span className="text-2xl">
                      {wallet.id === "freighter"
                        ? "🦊"
                        : wallet.id === "albedo"
                        ? "🌟"
                        : wallet.id === "xbull"
                        ? "🐂"
                        : "🦞"}
                    </span>
                  </div>

                  {/* Wallet Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {wallet.name}
                      </p>
                      {!isInstalled && (
                        <Badge variant="secondary" className="text-[10px]">
                          Not Installed
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {walletDescriptions[wallet.id]}
                    </p>
                  </div>

                  {/* Arrow or Loading */}
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  ) : isInstalled ? (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  ) : (
                    <a
                      href={`https://www.stellar.org/ecosystem/projects?search=${wallet.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-stellar-600 hover:text-stellar-700 dark:text-stellar-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Install
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Help Text */}
        <p className="text-center text-xs text-gray-400 mt-6">
          New to Stellar?{" "}
          <a
            href="https://www.stellar.org/learn/intro-to-stellar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-stellar-600 hover:underline dark:text-stellar-400"
          >
            Learn more about wallets
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
