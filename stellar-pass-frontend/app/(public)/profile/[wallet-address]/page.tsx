"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  User,
  Wallet,
  Ticket,
  Award,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { TicketCard } from "@/components/attendee/TicketCard";
import { POAPGallery } from "@/components/attendee/POAPGallery";
import { truncateAddress } from "@/lib/utils";
import { HORIZON_URL } from "@/lib/constants";

// Mock data - replace with API calls
const mockProfile = {
  address: "GABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ",
  name: "Stellar Enthusiast",
  bio: "Blockchain developer and event organizer",
  joinedAt: "2023-06-15",
  stats: {
    events: 12,
    tickets: 8,
    poaps: 5,
  },
};

const mockTickets = [
  {
    id: "tkt_001",
    eventId: "1",
    eventName: "Stellar Summit 2024",
    eventDate: "2024-06-15T09:00:00",
    eventVenue: "Moscone Center, SF",
    tierName: "VIP",
    tierId: "2",
    walletAddress: mockProfile.address,
    status: "active" as const,
    checkedIn: false,
    purchasedAt: "2024-03-01T10:00:00",
  },
  {
    id: "tkt_002",
    eventId: "2",
    eventName: "DeFi Meetup SF",
    eventDate: "2024-07-20T18:00:00",
    eventVenue: "Galvanize, SF",
    tierName: "General Admission",
    tierId: "1",
    walletAddress: mockProfile.address,
    status: "used" as const,
    checkedIn: true,
    purchasedAt: "2024-03-15T14:30:00",
  },
];

const mockPOAPs = [
  {
    id: "poap_001",
    eventId: "1",
    eventName: "Stellar Summit 2024",
    eventDate: "2024-06-15",
    badgeUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
    name: "Stellar Summit 2024 Attendee",
    claimedAt: "2024-06-15T18:00:00",
    txHash: "abc123...",
  },
  {
    id: "poap_002",
    eventId: "2",
    eventName: "DeFi Meetup SF",
    eventDate: "2024-07-20",
    badgeUrl: "https://images.unsplash.com/photo-1622630998477-20aa696ecb05",
    name: "DeFi Meetup SF Participant",
    claimedAt: "2024-07-20T21:00:00",
    txHash: "def456...",
  },
];

export default function PublicProfilePage() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(mockProfile.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-stellar flex-shrink-0">
                  <User className="h-10 w-10 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {mockProfile.name}
                    </h1>
                    <Badge variant="default">Verified</Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-sm font-mono text-gray-500 truncate">
                      {truncateAddress(mockProfile.address, 12)}
                    </p>
                    <button
                      onClick={handleCopy}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-success-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <a
                      href={`${HORIZON_URL}/accounts/${mockProfile.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {mockProfile.bio}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {mockProfile.stats.events}
                      </p>
                      <p className="text-xs text-gray-500">Events</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {mockProfile.stats.tickets}
                      </p>
                      <p className="text-xs text-gray-500">Tickets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {mockProfile.stats.poaps}
                      </p>
                      <p className="text-xs text-gray-500">POAPs</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="tickets">
          <TabsList className="mb-6">
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="poaps" className="gap-2">
              <Award className="h-4 w-4" />
              POAPs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tickets">
            <div className="grid gap-4 sm:grid-cols-2">
              {mockTickets.map((ticket, index) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TicketCard ticket={ticket} compact />
                </motion.div>
              ))}
            </div>
            {mockTickets.length === 0 && (
              <div className="text-center py-12">
                <Ticket className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500">No tickets yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="poaps">
            <POAPGallery poaps={mockPOAPs} />
            {mockPOAPs.length === 0 && (
              <div className="text-center py-12">
                <Award className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500">No POAPs yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
