"use client";

import React from "react";
import Link from "next/link";
import { Award, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { POAPGallery } from "@/components/attendee/POAPGallery";
import { WalletConnect } from "@/components/attendee/WalletConnect";
import { useWallet } from "@/hooks/useWallet";

// Mock data - replace with API calls
const mockPOAPs = [
  {
    id: "poap_001",
    eventId: "1",
    eventName: "Stellar Summit 2024",
    eventDate: "2024-06-15",
    badgeUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
    name: "Stellar Summit 2024 Attendee",
    description: "Proof of attendance for Stellar Summit 2024",
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
    description: "Attended the DeFi Meetup in San Francisco",
    claimedAt: "2024-07-20T21:00:00",
    txHash: "def456...",
  },
  {
    id: "poap_003",
    eventId: "3",
    eventName: "Blockchain Workshop",
    eventDate: "2024-04-10",
    badgeUrl: "https://images.unsplash.com/photo-1639762681057-408e52192e55",
    name: "Blockchain Workshop Graduate",
    description: "Successfully completed the blockchain development workshop",
    claimedAt: "2024-04-10T17:00:00",
  },
];

export default function POAPsPage() {
  const { connected } = useWallet();
  const [search, setSearch] = React.useState("");

  const filtered = mockPOAPs.filter(
    (poap) =>
      search === "" ||
      poap.eventName.toLowerCase().includes(search.toLowerCase()) ||
      poap.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleShare = (poapId: string) => {
    const poap = mockPOAPs.find((p) => p.id === poapId);
    if (poap && navigator.share) {
      navigator.share({
        title: poap.name,
        text: `I collected a POAP badge from ${poap.eventName}!`,
        url: window.location.href,
      });
    }
  };

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
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-950">
              <Award className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My POAPs
              </h1>
              <p className="text-sm text-gray-500">
                Your collection of Proof of Attendance badges
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {mockPOAPs.length}
            </p>
            <p className="text-xs text-gray-500">Total POAPs</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {mockPOAPs.length}
            </p>
            <p className="text-xs text-gray-500">Events Attended</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {mockPOAPs.filter((p) => p.txHash).length}
            </p>
            <p className="text-xs text-gray-500">On-Chain</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              3
            </p>
            <p className="text-xs text-gray-500">This Month</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search POAPs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Gallery */}
        {filtered.length > 0 ? (
          <POAPGallery
            poaps={filtered}
            onShare={handleShare}
            onSelect={(id) => window.location.href = `/poaps/${id}`}
          />
        ) : (
          <div className="text-center py-16">
            <Award className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              No POAPs found
            </h3>
            <p className="text-sm text-gray-500">
              {search
                ? "Try adjusting your search"
                : "Attend events to collect POAP badges"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
