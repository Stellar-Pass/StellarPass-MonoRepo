"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  QrCode,
  Share2,
  ArrowRightLeft,
  CheckCircle,
  Copy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, truncateAddress } from "@/lib/utils";
import { generateTicketQR, type TicketQRData } from "@/lib/qr";
import type { TicketStatus } from "@/lib/constants";

interface TicketCardProps {
  ticket: {
    id: string;
    eventId: string;
    eventName: string;
    eventDate: string;
    eventVenue: string;
    eventImageUrl?: string;
    tierName: string;
    tierId: string;
    walletAddress: string;
    status: TicketStatus;
    checkedIn: boolean;
    purchasedAt: string;
  };
  onTransfer?: (ticketId: string) => void;
  onResell?: (ticketId: string) => void;
  onShare?: (ticketId: string) => void;
  compact?: boolean;
}

const statusConfig: Record<
  TicketStatus,
  { label: string; variant: "default" | "success" | "danger" | "secondary" | "warning" }
> = {
  active: { label: "Active", variant: "success" },
  used: { label: "Used", variant: "secondary" },
  expired: { label: "Expired", variant: "secondary" },
  transferred: { label: "Transferred", variant: "warning" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

export function TicketCard({
  ticket,
  onTransfer,
  onResell,
  onShare,
  compact = false,
}: TicketCardProps) {
  const [qrCode, setQrCode] = useState<string>("");
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const generateQR = async () => {
      const qrData: TicketQRData = {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        tierId: ticket.tierId,
        walletAddress: ticket.walletAddress,
        timestamp: Date.now(),
      };
      const dataUrl = await generateTicketQR(qrData);
      setQrCode(dataUrl);
    };
    generateQR();
  }, [ticket]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(ticket.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const status = statusConfig[ticket.status];

  if (compact) {
    return (
      <Card hover className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {ticket.eventImageUrl ? (
              <img
                src={ticket.eventImageUrl}
                alt={ticket.eventName}
                className="h-16 w-16 rounded-xl object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gradient-stellar flex items-center justify-center">
                <QrCode className="h-8 w-8 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {ticket.eventName}
              </h3>
              <p className="text-sm text-gray-500">{ticket.tierName}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {formatDate(ticket.eventDate)}
              </p>
            </div>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden">
        {/* Ticket Top */}
        <div className="relative h-32 bg-gradient-stellar">
          {ticket.eventImageUrl && (
            <img
              src={ticket.eventImageUrl}
              alt={ticket.eventName}
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="relative z-10 p-4">
            <Badge variant={status.variant} className="mb-2">
              {ticket.checkedIn && <CheckCircle className="h-3 w-3 mr-1" />}
              {status.label}
            </Badge>
            <h3 className="text-lg font-bold text-white">{ticket.eventName}</h3>
          </div>
        </div>

        {/* Dotted separator */}
        <div className="relative h-0">
          <div className="absolute left-0 right-0 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-900" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-900" />
        </div>

        <CardContent className="p-4 pt-6">
          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(ticket.eventDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4" />
              <span>{ticket.eventVenue}</span>
            </div>
          </div>

          {/* Tier & Ticket ID */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-900 mb-4">
            <div>
              <p className="text-xs text-gray-500">Tier</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {ticket.tierName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Ticket ID</p>
              <div className="flex items-center gap-1">
                <p className="font-mono text-xs text-gray-600 dark:text-gray-400">
                  {truncateAddress(ticket.id, 6)}
                </p>
                <button
                  onClick={handleCopy}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {copied ? (
                    <CheckCircle className="h-3 w-3 text-success-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {showQr && qrCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-200 dark:border-gray-700">
                <img
                  src={qrCode}
                  alt="Ticket QR Code"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                Show this QR code at the venue entrance
              </p>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowQr(!showQr)}
            >
              <QrCode className="h-4 w-4 mr-1.5" />
              {showQr ? "Hide" : "Show"} QR
            </Button>
            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onShare(ticket.id)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            {ticket.status === "active" && onTransfer && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onTransfer(ticket.id)}
              >
                <ArrowRightLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
