"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Ticket,
  Search,
  Filter,
  Calendar,
  QrCode,
  Wallet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TicketCard } from "@/components/attendee/TicketCard";
import { WalletConnect } from "@/components/attendee/WalletConnect";
import { useWallet } from "@/hooks/useWallet";
import type { TicketStatus } from "@/lib/constants";

// Mock data - replace with API calls
const mockTickets = [
  {
    id: "tkt_001",
    eventId: "1",
    eventName: "Stellar Summit 2024",
    eventDate: "2024-06-15T09:00:00",
    eventVenue: "Moscone Center, SF",
    eventImageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
    tierName: "VIP",
    tierId: "2",
    walletAddress: "GABC123...",
    status: "active" as TicketStatus,
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
    walletAddress: "GABC123...",
    status: "active" as TicketStatus,
    checkedIn: false,
    purchasedAt: "2024-03-15T14:30:00",
  },
  {
    id: "tkt_003",
    eventId: "3",
    eventName: "Blockchain Workshop",
    eventDate: "2024-04-10T10:00:00",
    eventVenue: "WeWork, Mission",
    tierName: "Early Bird",
    tierId: "3",
    walletAddress: "GABC123...",
    status: "used" as TicketStatus,
    checkedIn: true,
    purchasedAt: "2024-02-01T09:00:00",
  },
];

export default function TicketsPage() {
  const { connected } = useWallet();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  const filtered = mockTickets.filter((ticket) => {
    const matchesSearch =
      search === "" ||
      ticket.eventName.toLowerCase().includes(search.toLowerCase()) ||
      ticket.tierName.toLowerCase().includes(search.toLowerCase());

    const eventDate = new Date(ticket.eventDate);
    const now = new Date();
    const matchesFilter =
      filter === "all" ||
      (filter === "upcoming" && eventDate > now) ||
      (filter === "past" && eventDate <= now);

    return matchesSearch && matchesFilter;
  });

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 py-12">
        <div className="mx-auto max-w-md px-4">
          <WalletConnect />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Tickets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your event tickets and NFTs
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockTickets.length}
              </p>
              <p className="text-xs text-gray-500">Total Tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockTickets.filter((t) => t.status === "active").length}
              </p>
              <p className="text-xs text-gray-500">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockTickets.filter((t) => t.checkedIn).length}
              </p>
              <p className="text-xs text-gray-500">Attended</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "upcoming", "past"] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Tickets Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/tickets/${ticket.id}`}>
                  <TicketCard ticket={ticket} />
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Ticket className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No tickets found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {search
                  ? "Try adjusting your search"
                  : "Purchase tickets to see them here"}
              </p>
              {!search && (
                <Link href="/tickets">
                  <Button>Browse Events</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
