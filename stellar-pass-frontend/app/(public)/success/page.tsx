"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Ticket,
  Calendar,
  MapPin,
  ArrowRight,
  Download,
  Share2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate, truncateAddress } from "@/lib/utils";
import { generateTicketQR, type TicketQRData } from "@/lib/qr";

// Mock data - replace with API call
const mockTicket = {
  id: "tkt_abc123def456",
  eventId: "1",
  eventName: "Stellar Summit 2024",
  eventDate: "2024-06-15T09:00:00",
  eventVenue: "Moscone Center, SF",
  tierName: "General Admission",
  tierId: "1",
  walletAddress: "GABC123DEF456...",
  txHash: "abc123def456...",
};

export default function SuccessPage() {
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    const generateQR = async () => {
      const qrData: TicketQRData = {
        ticketId: mockTicket.id,
        eventId: mockTicket.eventId,
        tierId: mockTicket.tierId,
        walletAddress: mockTicket.walletAddress,
        timestamp: Date.now(),
      };
      const dataUrl = await generateTicketQR(qrData);
      setQrCode(dataUrl);
    };
    generateQR();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 py-12">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 10 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-success-50 dark:bg-success-950 mx-auto mb-6"
          >
            <CheckCircle className="h-10 w-10 text-success-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ticket Purchased!
          </h1>
          <p className="text-gray-500 mb-8">
            Your NFT ticket has been minted and sent to your wallet.
          </p>
        </motion.div>

        {/* Ticket Card */}
        <Card className="overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-stellar p-6 text-center">
            <Badge variant="success" className="mb-3">
              <CheckCircle className="h-3 w-3 mr-1" />
              Confirmed
            </Badge>
            <h2 className="text-xl font-bold text-white">
              {mockTicket.eventName}
            </h2>
          </div>

          {/* Dotted separator */}
          <div className="relative h-0">
            <div className="absolute left-0 right-0 border-t-2 border-dashed border-gray-200 dark:border-gray-700" />
            <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-900" />
            <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-900" />
          </div>

          <CardContent className="p-6 pt-8">
            {/* QR Code */}
            {qrCode && (
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <img
                    src={qrCode}
                    alt="Ticket QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {formatDate(mockTicket.eventDate)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {mockTicket.eventVenue}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Ticket className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {mockTicket.tierName}
                </span>
              </div>
            </div>

            {/* Ticket ID */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900 mb-4">
              <p className="text-xs text-gray-500 mb-1">Ticket ID</p>
              <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                {mockTicket.id}
              </p>
            </div>

            {/* Transaction */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-500 mb-1">Transaction</p>
              <a
                href={`https://stellar.expert/explorer/public/tx/${mockTicket.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-stellar-600 hover:underline dark:text-stellar-400"
              >
                {truncateAddress(mockTicket.txHash, 12)}
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Link href={`/tickets/${mockTicket.id}`}>
            <Button className="w-full">
              View My Ticket
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Save QR
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          <Link href="/tickets">
            <Button variant="ghost" className="w-full">
              View All My Tickets
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
