"use client";

import React from "react";
import Link from "next/link";
import { Ticket, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { IS_TESTNET } from "@/lib/constants";

export default function ScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [online, setOnline] = React.useState(true);

  React.useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Scanner Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg p-1.5 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-stellar">
                <Ticket className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">Scanner</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {IS_TESTNET && (
              <Badge variant="warning" className="text-[10px]">
                Testnet
              </Badge>
            )}
            {online ? (
              <Badge variant="success" className="text-[10px]">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="warning" className="text-[10px]">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
