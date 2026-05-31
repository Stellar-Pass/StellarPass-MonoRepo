"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Ticket,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { cn, truncateAddress } from "@/lib/utils";
import { HORIZON_URL, IS_TESTNET, NAV_LINKS } from "@/lib/constants";

export function Navbar() {
  const pathname = usePathname();
  const { connected, publicKey, walletType, loading: walletLoading, disconnect } = useWallet();
  const { authenticated, login, logout, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleCopyAddress = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async () => {
    if (!authenticated && connected) {
      await login();
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-stellar">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold font-display text-gray-900 dark:text-white">
              Stellar Pass
            </span>
            {IS_TESTNET && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0.5">
                Testnet
              </Badge>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {NAV_LINKS.public.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-stellar-50 text-stellar-700 dark:bg-stellar-950 dark:text-stellar-300"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-900"
                )}
              >
                {link.label}
              </Link>
            ))}
            {connected && (
              <Link
                href="/dashboard"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith("/dashboard")
                    ? "bg-stellar-50 text-stellar-700 dark:bg-stellar-950 dark:text-stellar-300"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-900"
                )}
              >
                Dashboard
              </Link>
            )}
          </div>

          {/* Wallet Section */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {connected && publicKey ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-stellar" />
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                    {truncateAddress(publicKey)}
                  </span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-950"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Connected via {walletType}
                        </p>
                        <p className="font-mono text-xs text-gray-700 dark:text-gray-300 mt-1">
                          {publicKey}
                        </p>
                      </div>
                      <button
                        onClick={handleCopyAddress}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900 transition-colors"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-success-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {copied ? "Copied!" : "Copy address"}
                      </button>
                      <a
                        href={`${HORIZON_URL}/accounts/${publicKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Explorer
                      </a>
                      {!authenticated && (
                        <button
                          onClick={handleLogin}
                          disabled={authLoading}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-stellar-700 hover:bg-stellar-50 dark:text-stellar-300 dark:hover:bg-stellar-950 transition-colors"
                        >
                          {authLoading ? "Authenticating..." : "Sign in for Dashboard"}
                        </button>
                      )}
                      <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
                        <button
                          onClick={() => {
                            disconnect();
                            logout();
                            setProfileOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Disconnect
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/checkout">
                <Button size="sm" loading={walletLoading}>
                  Connect Wallet
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.public.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2.5 rounded-lg text-sm font-medium",
                    pathname === link.href
                      ? "bg-stellar-50 text-stellar-700 dark:bg-stellar-950 dark:text-stellar-300"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {connected && (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2.5 rounded-lg text-sm font-medium",
                    pathname.startsWith("/dashboard")
                      ? "bg-stellar-50 text-stellar-700 dark:bg-stellar-950 dark:text-stellar-300"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900"
                  )}
                >
                  Dashboard
                </Link>
              )}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800">
                {connected && publicKey ? (
                  <div className="space-y-2">
                    <div className="px-4 py-2">
                      <p className="text-xs text-gray-500">{truncateAddress(publicKey)}</p>
                      <p className="text-[10px] text-gray-400 capitalize">via {walletType}</p>
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg text-sm text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-950 text-left"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="px-4">
                    <Link href="/checkout" onClick={() => setMobileMenuOpen(false)}>
                      <Button size="full">Connect Wallet</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
