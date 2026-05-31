"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Share2,
  ArrowRightLeft,
  Download,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/Modal";
import { formatDate, truncateAddress } from "@/lib/utils";
import { generateTicketQR, type TicketQRData } from "@/lib/qr";
import { SocialShare } from "@/components/attendee/SocialShare";

// Mock data - replace with API call
const mockTicket = {
  id: "tkt_001",
  eventId: "1",
  eventName: "Stellar Summit 2024",
  eventDate: "2024-06-15T09:00:00",
  eventVenue: "Moscone Center, SF",
  eventImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  tierName: "VIP",
  tierId: "2",
  walletAddress: "GABC123DEF456GHI789JKL012MNO345PQR678STU901",
  status: "active" as const,
  checkedIn: false,
  purchasedAt: "2024-03-01T10:00:00",
  txHash: "abc123def456ghi789jkl012mno345pqr678stu901",
};

export default function TicketDetailPage() {
  const router = useRouter();
  const [qrCode, setQrCode] = useState<string>("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferring, setTransferring] = useState(false);

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

  const handleTransfer = async () => {
    if (!transferAddress) return;
    setTransferring(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setTransferring(false);
    setShowTransfer(false);
    // Show success message
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 py-12">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </button>

        {/* Ticket Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden">
            {/* Header */}
            <div className="relative h-40 bg-gradient-stellar">
              {mockTicket.eventImageUrl && (
                <img
                  src={mockTicket.eventImageUrl}
                  alt={mockTicket.eventName}
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="relative z-10 p-6">
                <Badge variant="success" className="mb-3">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {mockTicket.status === "active" ? "Active" : "Used"}
                </Badge>
                <h1 className="text-2xl font-bold text-white">
                  {mockTicket.eventName}
                </h1>
              </div>
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
                  <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <img
                      src={qrCode}
                      alt="Ticket QR Code"
                      className="w-56 h-56"
                    />
                  </div>
                </div>
              )}

              <p className="text-center text-sm text-gray-500 mb-6">
                Show this QR code at the venue entrance
              </p>

              {/* Event Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate(mockTicket.eventDate)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(mockTicket.eventDate).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {mockTicket.eventVenue}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Ticket className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {mockTicket.tierName}
                  </span>
                </div>
              </div>

              {/* Ticket Info */}
              <div className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Ticket ID</span>
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {truncateAddress(mockTicket.id, 8)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Wallet</span>
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {truncateAddress(mockTicket.walletAddress, 6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Purchased</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(mockTicket.purchasedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Transaction</span>
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${mockTicket.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-stellar-600 hover:underline dark:text-stellar-400 flex items-center gap-1"
                  >
                    {truncateAddress(mockTicket.txHash, 6)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {mockTicket.status === "active" && (
                  <Button
                    className="w-full"
                    onClick={() => setShowTransfer(true)}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer Ticket
                  </Button>
                )}

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
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Social Share */}
        <div className="mt-6">
          <SocialShare
            title={`I'm attending ${mockTicket.eventName}!`}
            description={`Check out ${mockTicket.eventName} - get your NFT ticket on Stellar Pass`}
            hashtags={["StellarPass", "Stellar", "NFT", "Events"]}
          />
        </div>
      </div>

      {/* Transfer Modal */}
      <Modal open={showTransfer} onOpenChange={setShowTransfer}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Transfer Ticket</ModalTitle>
            <ModalDescription>
              Transfer your ticket to another Stellar wallet address.
            </ModalDescription>
          </ModalHeader>

          <div className="space-y-4 py-4">
            <Input
              label="Recipient Wallet Address"
              placeholder="G..."
              value={transferAddress}
              onChange={(e) => setTransferAddress(e.target.value)}
              helperText="Enter the Stellar public key of the recipient"
            />

            <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This action cannot be undone. The ticket will be transferred to
                the recipient&apos;s wallet.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleTransfer}
              loading={transferring}
              disabled={!transferAddress}
              className="flex-1"
            >
              Transfer
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowTransfer(false)}
            >
              Cancel
            </Button>
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}
