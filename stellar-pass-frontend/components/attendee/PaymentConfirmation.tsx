"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCurrency, truncateAddress } from "@/lib/utils";
import { HORIZON_URL, IS_TESTNET } from "@/lib/constants";

interface PaymentConfirmationProps {
  event: {
    name: string;
    date: string;
    venue: string;
  };
  tier: {
    name: string;
    price: string;
  };
  paymentAddress: string;
  paymentAmount: string;
  paymentMemo?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  status: "pending" | "confirming" | "success" | "error";
  error?: string;
  txHash?: string;
}

export function PaymentConfirmation({
  event,
  tier,
  paymentAddress,
  paymentAmount,
  paymentMemo,
  onConfirm,
  onCancel,
  status,
  error,
  txHash,
}: PaymentConfirmationProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  useEffect(() => {
    if (status !== "pending") return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-50 dark:bg-success-950 mx-auto mb-6">
          <Check className="h-10 w-10 text-success-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-500 mb-4">
          Your ticket for {event.name} has been minted.
        </p>
        {txHash && (
          <a
            href={`${HORIZON_URL}/transactions/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-stellar-600 hover:underline dark:text-stellar-400"
          >
            View Transaction
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </motion.div>
    );
  }

  if (status === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-950 mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-danger-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Payment Failed
        </h2>
        <p className="text-gray-500 mb-6">
          {error || "Something went wrong with your payment."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={onConfirm}>Try Again</Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Confirm Payment
        </h2>

        {/* Order Summary */}
        <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            Order Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Event
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {event.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Date
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(event.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Tier
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {tier.name}
              </span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Total
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(paymentAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-gray-500">
            Send Payment To
          </h3>

          {/* Address */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Address</p>
              <p className="text-sm font-mono text-gray-900 dark:text-white">
                {truncateAddress(paymentAddress, 12)}
              </p>
            </div>
            <button
              onClick={() => handleCopy(paymentAddress, "address")}
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              {copied === "address" ? (
                <Check className="h-4 w-4 text-success-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Amount</p>
              <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                {paymentAmount} XLM
              </p>
            </div>
            <button
              onClick={() => handleCopy(paymentAmount, "amount")}
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              {copied === "amount" ? (
                <Check className="h-4 w-4 text-success-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Memo */}
          {paymentMemo && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Memo (Required)</p>
                <p className="text-sm font-mono text-gray-900 dark:text-white">
                  {paymentMemo}
                </p>
              </div>
              <button
                onClick={() => handleCopy(paymentMemo, "memo")}
                className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                {copied === "memo" ? (
                  <Check className="h-4 w-4 text-success-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Timer */}
        {status === "pending" && countdown > 0 && (
          <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Payment expires in {formatTime(countdown)}</span>
          </div>
        )}

        {/* Network Badge */}
        {IS_TESTNET && (
          <div className="flex justify-center mb-4">
            <Badge variant="warning">
              <Shield className="h-3 w-3 mr-1" />
              Testnet Mode
            </Badge>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onConfirm}
            loading={status === "confirming"}
            className="flex-1"
          >
            {status === "confirming" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              "I've Sent the Payment"
            )}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
