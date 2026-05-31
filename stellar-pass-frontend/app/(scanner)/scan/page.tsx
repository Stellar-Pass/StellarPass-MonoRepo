"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Keyboard,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Clock,
  WifiOff,
  RefreshCw,
  ScanLine,
} from "lucide-react";
import { ScannerCamera } from "@/components/scanner/ScannerCamera";
import { ScanResult } from "@/components/scanner/ScanResult";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { parseTicketQR, isValidTicketQR } from "@/lib/qr";

interface CheckInRecord {
  id: string;
  ticketId: string;
  attendeeName?: string;
  tierName?: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

export default function ScannerPage() {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualId, setManualId] = useState("");
  const [scanStatus, setScanStatus] = useState<
    "idle" | "scanning" | "valid" | "invalid" | "already-used" | "error"
  >("idle");
  const [scanMessage, setScanMessage] = useState<string>();
  const [attendee, setAttendee] = useState<{
    name?: string;
    walletAddress: string;
    tierName: string;
  }>();
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [online, setOnline] = useState(true);
  const [pendingQueue, setPendingQueue] = useState<string[]>([]);

  useEffect(() => {
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

  // Process pending queue when coming back online
  useEffect(() => {
    if (online && pendingQueue.length > 0) {
      // Process queued check-ins
      pendingQueue.forEach(async (ticketId) => {
        await processCheckIn(ticketId);
      });
      setPendingQueue([]);
    }
  }, [online, pendingQueue]);

  const processCheckIn = useCallback(
    async (ticketId: string) => {
      setScanStatus("scanning");

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock validation logic
      const isValid = !ticketId.includes("invalid");
      const isUsed = ticketId.includes("used");

      if (isUsed) {
        setScanStatus("already-used");
        setScanMessage("This ticket has already been checked in");
        setAttendee({
          name: "John Doe",
          walletAddress: "GABC123...",
          tierName: "VIP",
        });

        const record: CheckInRecord = {
          id: crypto.randomUUID(),
          ticketId,
          attendeeName: "John Doe",
          tierName: "VIP",
          success: false,
          message: "Already checked in",
          timestamp: new Date(),
        };
        setRecords((prev) => [record, ...prev]);
      } else if (isValid) {
        setScanStatus("valid");
        setScanMessage("Ticket validated successfully");
        setAttendee({
          name: "Jane Smith",
          walletAddress: "GDEF456...",
          tierName: "General Admission",
        });

        const record: CheckInRecord = {
          id: crypto.randomUUID(),
          ticketId,
          attendeeName: "Jane Smith",
          tierName: "General Admission",
          success: true,
          message: "Checked in",
          timestamp: new Date(),
        };
        setRecords((prev) => [record, ...prev]);
      } else {
        setScanStatus("invalid");
        setScanMessage("Invalid ticket ID");
        setAttendee(undefined);

        const record: CheckInRecord = {
          id: crypto.randomUUID(),
          ticketId,
          success: false,
          message: "Invalid ticket",
          timestamp: new Date(),
        };
        setRecords((prev) => [record, ...prev]);
      }
    },
    []
  );

  const handleScan = useCallback(
    async (data: string) => {
      // Parse QR data
      const qrData = parseTicketQR(data);
      if (qrData && isValidTicketQR(qrData)) {
        if (!online) {
          // Queue for later
          setPendingQueue((prev) => [...prev, qrData.ticketId]);
          setScanStatus("valid");
          setScanMessage("Queued for sync when online");
          return;
        }
        await processCheckIn(qrData.ticketId);
      } else {
        // Try as raw ticket ID
        if (!online) {
          setPendingQueue((prev) => [...prev, data]);
          setScanStatus("valid");
          setScanMessage("Queued for sync when online");
          return;
        }
        await processCheckIn(data);
      }
    },
    [online, processCheckIn]
  );

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    await handleScan(manualId.trim());
    setManualId("");
  };

  const dismissResult = () => {
    setScanStatus("idle");
    setScanMessage(undefined);
    setAttendee(undefined);
  };

  const checkedInCount = records.filter((r) => r.success).length;
  const failedCount = records.filter((r) => !r.success).length;

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Stats Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-success-500" />
            <span className="text-sm text-white">{checkedInCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-danger-500" />
            <span className="text-sm text-white">{failedCount}</span>
          </div>
        </div>

        {pendingQueue.length > 0 && (
          <Badge variant="warning">
            <WifiOff className="h-3 w-3 mr-1" />
            {pendingQueue.length} pending
          </Badge>
        )}
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 px-4 py-3">
        <Button
          variant={mode === "camera" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("camera")}
          className={cn(
            mode !== "camera" && "text-gray-400 hover:text-white"
          )}
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("manual")}
          className={cn(
            mode !== "manual" && "text-gray-400 hover:text-white"
          )}
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Manual
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center px-4 pb-4">
        {mode === "camera" ? (
          <div className="w-full max-w-md">
            <ScannerCamera
              onScan={handleScan}
              active={scanStatus === "idle"}
              className="aspect-[3/4]"
            />
          </div>
        ) : (
          <div className="w-full max-w-md">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <ScanLine className="h-12 w-12 text-stellar-500 mx-auto mb-3" />
                <h2 className="text-lg font-semibold text-white">
                  Enter Ticket ID
                </h2>
                <p className="text-sm text-gray-400">
                  Type or paste the ticket ID to check in
                </p>
              </div>
              <Input
                placeholder="Ticket ID..."
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                leftIcon={<ScanLine className="h-4 w-4" />}
              />
              <Button type="submit" className="w-full" disabled={!manualId.trim()}>
                Check In
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Scan Result Overlay */}
      <AnimatePresence>
        {scanStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-sm">
              <ScanResult
                status={scanStatus}
                message={scanMessage}
                attendee={attendee}
                onDismiss={dismissResult}
                autoDismissMs={3000}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Activity */}
      {records.length > 0 && (
        <div className="border-t border-gray-800 px-4 py-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Recent
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {records.slice(0, 10).map((record) => (
              <div
                key={record.id}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs whitespace-nowrap",
                  record.success
                    ? "bg-success-900/30 text-success-300"
                    : "bg-danger-900/30 text-danger-300"
                )}
              >
                {record.success ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {record.attendeeName || record.ticketId.slice(0, 8)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
