"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { authenticated, login, loading: authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Show loading while checking auth
  if (!connected) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stellar-50 dark:bg-stellar-950 mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-stellar-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            You need to connect a Stellar wallet to access the dashboard.
          </p>
          <Button onClick={() => router.push("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stellar-50 dark:bg-stellar-950 mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-stellar-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Please sign the authentication challenge to access the dashboard.
          </p>
          <Button onClick={login} loading={authLoading}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
