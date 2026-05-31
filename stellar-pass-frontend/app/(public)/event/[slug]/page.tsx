"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EventHero } from "@/components/attendee/EventHero";
import { TierSelector } from "@/components/attendee/TierSelector";
import { SocialShare } from "@/components/attendee/SocialShare";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar,
  MapPin,
  Users,
  Shield,
  Globe,
  ExternalLink,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

// Mock data - replace with API call
const mockEvent = {
  id: "1",
  name: "Stellar Summit 2024",
  description:
    "Join us for the premier Stellar blockchain conference. Three days of talks, workshops, and networking with the brightest minds in the Stellar ecosystem. Learn about the latest developments in DeFi, NFTs, and cross-border payments.",
  date: "2024-06-15T09:00:00",
  endDate: "2024-06-17T18:00:00",
  venue: "Moscone Center",
  location: "San Francisco, CA",
  imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
  organizer: {
    name: "Stellar Development Foundation",
    address: "GABC123...",
  },
  ticketsSold: 450,
  totalTickets: 500,
  status: "published" as const,
  slug: "stellar-summit-2024",
  tiers: [
    {
      id: "1",
      name: "General Admission",
      price: "50",
      supply: 250,
      sold: 200,
      description: "Standard conference access",
      features: [
        "All keynote sessions",
        "Networking areas",
        "Lunch included",
        "Conference swag bag",
      ],
      transferable: true,
    },
    {
      id: "2",
      name: "VIP",
      price: "150",
      supply: 150,
      sold: 150,
      description: "Premium conference experience",
      features: [
        "All General Admission perks",
        "VIP lounge access",
        "Front-row seating",
        "Meet & greet with speakers",
        "Exclusive after-party",
      ],
      transferable: true,
    },
    {
      id: "3",
      name: "Early Bird",
      price: "35",
      supply: 100,
      sold: 100,
      description: "Limited early access tickets",
      features: [
        "All keynote sessions",
        "Networking areas",
        "Lunch included",
      ],
      transferable: false,
    },
  ],
};

export default function EventPage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handlePurchase = () => {
    if (selectedTier) {
      router.push(`/checkout?event=${mockEvent.id}&tier=${selectedTier}`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: mockEvent.name,
        text: mockEvent.description,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <EventHero
        name={mockEvent.name}
        description={mockEvent.description}
        date={mockEvent.date}
        endDate={mockEvent.endDate}
        venue={mockEvent.venue}
        location={mockEvent.location}
        imageUrl={mockEvent.imageUrl}
        organizerName={mockEvent.organizer.name}
        ticketsSold={mockEvent.ticketsSold}
        totalTickets={mockEvent.totalTickets}
        status={mockEvent.status}
        onShare={handleShare}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  About This Event
                </h2>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {mockEvent.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Date
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(mockEvent.date)}
                        {mockEvent.endDate &&
                          ` - ${formatDate(mockEvent.endDate)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Location
                      </p>
                      <p className="text-sm text-gray-500">
                        {mockEvent.venue}, {mockEvent.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Capacity
                      </p>
                      <p className="text-sm text-gray-500">
                        {mockEvent.totalTickets} attendees
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Blockchain
                      </p>
                      <p className="text-sm text-gray-500">Stellar Network</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Tiers */}
            <TierSelector
              tiers={mockEvent.tiers}
              selectedTier={selectedTier}
              onSelect={setSelectedTier}
              onPurchase={handlePurchase}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Organizer */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-4">
                  Organized by
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-stellar">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {mockEvent.organizer.name}
                    </p>
                    <a
                      href="#"
                      className="text-sm text-stellar-600 hover:underline dark:text-stellar-400 flex items-center gap-1"
                    >
                      View Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share */}
            <SocialShare
              title={mockEvent.name}
              description={mockEvent.description}
              url={typeof window !== "undefined" ? window.location.href : ""}
              hashtags={["StellarPass", "Stellar", "NFT", "Events"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
