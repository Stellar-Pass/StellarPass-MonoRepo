"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  User,
  Ticket,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface ScanResultProps {
  status: "idle" | "scanning" | "valid" | "invalid" | "already-used" | "error";
  message?: string;
  attendee?: {
    name?: string;
    walletAddress: string;
    tierName: string;
  };
  onDismiss?: () => void;
  autoDismissMs?: number;
}

const statusConfig = {
  idle: {
    icon: null,
    bg: "",
    border: "",
    text: "",
    sound: null,
  },
  scanning: {
    icon: Loader2,
    bg: "bg-stellar-50 dark:bg-stellar-950",
    border: "border-stellar-200 dark:border-stellar-800",
    text: "text-stellar-700 dark:text-stellar-300",
    sound: null,
  },
  valid: {
    icon: CheckCircle,
    bg: "bg-success-50 dark:bg-success-950",
    border: "border-success-200 dark:border-success-800",
    text: "text-success-700 dark:text-success-300",
    sound: "success",
  },
  invalid: {
    icon: XCircle,
    bg: "bg-danger-50 dark:bg-danger-950",
    border: "border-danger-200 dark:border-danger-800",
    text: "text-danger-700 dark:text-danger-300",
    sound: "error",
  },
  "already-used": {
    icon: AlertTriangle,
    bg: "bg-yellow-50 dark:bg-yellow-950",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-700 dark:text-yellow-300",
    sound: "warning",
  },
  error: {
    icon: XCircle,
    bg: "bg-danger-50 dark:bg-danger-950",
    border: "border-danger-200 dark:border-danger-800",
    text: "text-danger-700 dark:text-danger-300",
    sound: "error",
  },
};

export function ScanResult({
  status,
  message,
  attendee,
  onDismiss,
  autoDismissMs = 3000,
}: ScanResultProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  useEffect(() => {
    if (status === "valid" || status === "invalid" || status === "already-used" || status === "error") {
      // Play sound
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (status === "valid") {
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.3;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.15);
        } else {
          oscillator.frequency.value = 300;
          gainNode.gain.value = 0.3;
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.3);
        }
      } catch {
        // Audio not available
      }

      // Vibrate
      if (navigator.vibrate) {
        if (status === "valid") {
          navigator.vibrate(100);
        } else {
          navigator.vibrate([100, 50, 100]);
        }
      }

      // Auto dismiss
      if (onDismiss && autoDismissMs > 0) {
        const timer = setTimeout(onDismiss, autoDismissMs);
        return () => clearTimeout(timer);
      }
    }
  }, [status, onDismiss, autoDismissMs]);

  if (status === "idle") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: "spring", damping: 15, stiffness: 300 }}
        className={cn(
          "rounded-2xl border-2 p-6 text-center",
          config.bg,
          config.border
        )}
      >
        {Icon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 10 }}
          >
            <Icon
              className={cn(
                "h-16 w-16 mx-auto mb-4",
                config.text,
                status === "scanning" && "animate-spin"
              )}
            />
          </motion.div>
        )}

        <h3 className={cn("text-xl font-bold mb-1", config.text)}>
          {status === "valid" && "Valid Ticket!"}
          {status === "invalid" && "Invalid Ticket"}
          {status === "already-used" && "Already Checked In"}
          {status === "scanning" && "Scanning..."}
          {status === "error" && "Error"}
        </h3>

        {message && (
          <p className={cn("text-sm mb-4", config.text)}>
            {message}
          </p>
        )}

        {attendee && (
          <div className="mt-4 p-3 rounded-xl bg-white/50 dark:bg-black/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                {attendee.name || "Anonymous"}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Ticket className="h-4 w-4 text-gray-400" />
              <Badge variant="secondary">{attendee.tierName}</Badge>
            </div>
          </div>
        )}

        {onDismiss && status !== "scanning" && (
          <button
            onClick={onDismiss}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Dismiss
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
