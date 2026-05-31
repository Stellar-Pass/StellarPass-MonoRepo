"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  Keyboard,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  Clock,
  Camera,
  CameraOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { parseTicketQR, isValidTicketQR } from "@/lib/qr";

interface CheckInResult {
  success: boolean;
  message: string;
  ticketId?: string;
  attendeeName?: string;
  tierName?: string;
  timestamp: Date;
}

interface LiveCheckInProps {
  eventId: string;
  onCheckIn: (ticketId: string) => Promise<{ success: boolean; message: string; attendeeName?: string; tierName?: string }>;
  stats: {
    checkedIn: number;
    total: number;
  };
}

export function LiveCheckIn({ eventId, onCheckIn, stats }: LiveCheckInProps) {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualId, setManualId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [recentResults, setRecentResults] = useState<CheckInResult[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      streamRef.current = stream;
      setCameraActive(true);
      setScanning(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      setMode("manual");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setScanning(false);
  }, []);

  useEffect(() => {
    if (mode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const handleCheckIn = useCallback(
    async (ticketId: string) => {
      if (processing) return;
      setProcessing(true);
      setResult(null);

      try {
        const response = await onCheckIn(ticketId);
        const newResult: CheckInResult = {
          ...response,
          ticketId,
          timestamp: new Date(),
        };
        setResult(newResult);
        setRecentResults((prev) => [newResult, ...prev].slice(0, 10));
      } catch (err) {
        const errorResult: CheckInResult = {
          success: false,
          message: err instanceof Error ? err.message : "Check-in failed",
          ticketId,
          timestamp: new Date(),
        };
        setResult(errorResult);
        setRecentResults((prev) => [errorResult, ...prev].slice(0, 10));
      } finally {
        setProcessing(false);
        setManualId("");
      }
    },
    [onCheckIn, processing]
  );

  const handleManualSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualId.trim()) return;
      await handleCheckIn(manualId.trim());
    },
    [manualId, handleCheckIn]
  );

  // Simulated QR scan handler (in production, use a QR scanning library)
  const handleVideoFrame = useCallback(() => {
    // This would integrate with a QR scanning library like jsQR
    // For now, this is a placeholder
  }, []);

  const checkedInPercentage =
    stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 dark:bg-success-950">
              <Users className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.checkedIn}
              </p>
              <p className="text-xs text-gray-500">Checked In</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stellar-50 dark:bg-stellar-950">
              <ScanLine className="h-5 w-5 text-stellar-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total - stats.checkedIn}
              </p>
              <p className="text-xs text-gray-500">Remaining</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-500">Progress</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {Math.round(checkedInPercentage)}%
              </p>
            </div>
            <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-stellar"
                initial={{ width: 0 }}
                animate={{ width: `${checkedInPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          onClick={() => setMode("camera")}
          size="sm"
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
        </Button>
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          onClick={() => setMode("manual")}
          size="sm"
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Manual Entry
        </Button>
      </div>

      {/* Scanner Area */}
      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {mode === "camera" ? (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="relative aspect-video max-w-lg mx-auto rounded-xl overflow-hidden bg-gray-900">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />

                  {/* Scanning overlay */}
                  {scanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-64 h-64">
                        {/* Corner markers */}
                        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-stellar-500 rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-stellar-500 rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-stellar-500 rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-stellar-500 rounded-br-xl" />

                        {/* Scan line */}
                        <div className="absolute inset-x-4 top-0 h-1 bg-stellar-500 animate-scan-line" />
                      </div>
                    </div>
                  )}

                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <CameraOff className="h-12 w-12 mb-2" />
                      <p className="text-sm">Camera not available</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => setMode("manual")}
                      >
                        Use Manual Entry
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-center text-sm text-gray-500">
                  Point the camera at an attendee&apos;s QR code
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="manual"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <Input
                    label="Ticket ID"
                    placeholder="Enter ticket ID or scan code"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    leftIcon={<ScanLine className="h-4 w-4" />}
                  />
                  <Button
                    type="submit"
                    loading={processing}
                    disabled={!manualId.trim()}
                    className="w-full"
                  >
                    Check In
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Feedback */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "mt-6 p-6 rounded-xl text-center check-flash",
                  result.success
                    ? "bg-success-50 border-2 border-success-200 dark:bg-success-950 dark:border-success-800"
                    : "bg-danger-50 border-2 border-danger-200 dark:bg-danger-950 dark:border-danger-800"
                )}
              >
                {result.success ? (
                  <CheckCircle className="h-16 w-16 mx-auto text-success-500 mb-3" />
                ) : (
                  <XCircle className="h-16 w-16 mx-auto text-danger-500 mb-3" />
                )}
                <h3
                  className={cn(
                    "text-xl font-bold mb-1",
                    result.success
                      ? "text-success-700 dark:text-success-300"
                      : "text-danger-700 dark:text-danger-300"
                  )}
                >
                  {result.success ? "Valid Ticket!" : "Invalid Ticket"}
                </h3>
                <p
                  className={cn(
                    "text-sm",
                    result.success
                      ? "text-success-600 dark:text-success-400"
                      : "text-danger-600 dark:text-danger-400"
                  )}
                >
                  {result.message}
                </p>
                {result.attendeeName && (
                  <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {result.attendeeName}
                    {result.tierName && (
                      <Badge variant="secondary" className="ml-2">
                        {result.tierName}
                      </Badge>
                    )}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Recent Check-ins */}
      {recentResults.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              Recent Activity
            </h3>
            <div className="space-y-2">
              {recentResults.map((r, i) => (
                <div
                  key={`${r.ticketId}-${i}`}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  {r.success ? (
                    <CheckCircle className="h-4 w-4 text-success-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-danger-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {r.attendeeName || r.ticketId}
                    </p>
                    <p className="text-xs text-gray-500">{r.message}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {r.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
