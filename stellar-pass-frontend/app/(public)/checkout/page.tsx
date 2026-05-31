"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WalletConnect } from "@/components/attendee/WalletConnect";
import { PaymentConfirmation } from "@/components/attendee/PaymentConfirmation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWallet } from "@/hooks/useWallet";
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { IS_TESTNET } from "@/lib/constants";

// Mock data - replace with API call
const mockCheckout = {
  event: {
    id: "1",
    name: "Stellar Summit 2024",
    date: "2024-06-15T09:00:00",
    venue: "Moscone Center, SF",
  },
  tier: {
    id: "1",
    name: "General Admission",
    price: "50",
  },
  paymentAddress: "GABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ",
  paymentMemo: "SP-EVT1-TIER1-abc123",
};

type CheckoutStep = "connect" | "confirm" | "processing" | "success" | "error";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { connected, publicKey } = useWallet();

  const [step, setStep] = useState<CheckoutStep>("connect");
  const [txHash, setTxHash] = useState<string>();
  const [error, setError] = useState<string>();

  // Move to confirm step when wallet connects
  useEffect(() => {
    if (connected && step === "connect") {
      setStep("confirm");
    }
  }, [connected, step]);

  const handleConfirm = async () => {
    setStep("processing");
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Mock success
      setTxHash("abc123def456...");
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setStep("error");
    }
  };

  const handleCancel = () => {
    if (step === "confirm") {
      router.back();
    } else {
      setStep("confirm");
      setError(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Checkout
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete your ticket purchase
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { id: "connect", label: "Connect" },
            { id: "confirm", label: "Confirm" },
            { id: "success", label: "Complete" },
          ].map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && (
                <div
                  className={`h-0.5 w-12 ${
                    step === "success" ||
                    (step === "confirm" && i <= 1) ||
                    (step === "processing" && i <= 1)
                      ? "bg-stellar-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step === "success" ||
                    (step === s.id) ||
                    (step === "processing" && s.id === "confirm")
                      ? "bg-stellar-500 text-white"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                  }`}
                >
                  {step === "success" || (step === "processing" && s.id === "confirm") ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    step === s.id
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        {step === "connect" && (
          <WalletConnect required />
        )}

        {step === "confirm" && (
          <PaymentConfirmation
            event={mockCheckout.event}
            tier={mockCheckout.tier}
            paymentAddress={mockCheckout.paymentAddress}
            paymentAmount={mockCheckout.tier.price}
            paymentMemo={mockCheckout.paymentMemo}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            status="pending"
          />
        )}

        {step === "processing" && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-stellar-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Processing Payment
              </h2>
              <p className="text-sm text-gray-500">
                Please wait while we confirm your payment on the Stellar
                network...
              </p>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <PaymentConfirmation
            event={mockCheckout.event}
            tier={mockCheckout.tier}
            paymentAddress={mockCheckout.paymentAddress}
            paymentAmount={mockCheckout.tier.price}
            paymentMemo={mockCheckout.paymentMemo}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            status="success"
            txHash={txHash}
          />
        )}

        {step === "error" && (
          <PaymentConfirmation
            event={mockCheckout.event}
            tier={mockCheckout.tier}
            paymentAddress={mockCheckout.paymentAddress}
            paymentAmount={mockCheckout.tier.price}
            paymentMemo={mockCheckout.paymentMemo}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            status="error"
            error={error}
          />
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400">
          <Shield className="h-4 w-4" />
          <span>Secured by Stellar blockchain</span>
          {IS_TESTNET && (
            <Badge variant="warning" className="text-[10px]">
              Testnet
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
