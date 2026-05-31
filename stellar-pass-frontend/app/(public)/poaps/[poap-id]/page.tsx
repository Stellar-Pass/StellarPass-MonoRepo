"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Award,
  ExternalLink,
  Download,
  Share2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SocialShare } from "@/components/attendee/SocialShare";
import { formatDate, truncateAddress } from "@/lib/utils";

// Mock data - replace with API call
const mockPOAP = {
  id: "poap_001",
  eventId: "1",
  eventName: "Stellar Summit 2024",
  eventDate: "2024-06-15",
  eventVenue: "Moscone Center, SF",
  badgeUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0",
  name: "Stellar Summit 2024 Attendee",
  description:
    "This POAP badge commemorates attendance at the Stellar Summit 2024, the premier conference for the Stellar blockchain ecosystem. Holders of this badge were present for keynotes, workshops, and networking sessions.",
  claimedAt: "2024-06-15T18:00:00",
  txHash: "abc123def456ghi789jkl012mno345pqr678stu901",
  attributes: [
    { trait: "Event Type", value: "Conference" },
    { trait: "Location", value: "San Francisco, CA" },
    { trait: "Network", value: "Stellar" },
    { trait: "Edition", value: "First" },
  ],
};

export default function POAPDetailPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900/50 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to POAPs
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Badge Image */}
          <Card className="overflow-hidden mb-6">
            <div className="aspect-square relative">
              {mockPOAP.badgeUrl ? (
                <img
                  src={mockPOAP.badgeUrl}
                  alt={mockPOAP.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-stellar flex items-center justify-center">
                  <Award className="h-32 w-32 text-white/80" />
                </div>
              )}

              {/* Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <Badge variant="success" className="mb-2">
                  <Award className="h-3 w-3 mr-1" />
                  Claimed
                </Badge>
                <h1 className="text-2xl font-bold text-white">{mockPOAP.name}</h1>
              </div>
            </div>
          </Card>

          {/* Details */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                About This POAP
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {mockPOAP.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {mockPOAP.eventName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(mockPOAP.eventDate)} · {mockPOAP.eventVenue}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Award className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Claimed
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(mockPOAP.claimedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attributes */}
              {mockPOAP.attributes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Attributes
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {mockPOAP.attributes.map((attr) => (
                      <div
                        key={attr.trait}
                        className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900"
                      >
                        <p className="text-xs text-gray-500">{attr.trait}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {attr.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction */}
              {mockPOAP.txHash && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Transaction</p>
                      <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                        {truncateAddress(mockPOAP.txHash, 12)}
                      </p>
                    </div>
                    <a
                      href={`https://stellar.expert/explorer/public/tx/${mockPOAP.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stellar-600 hover:text-stellar-700 dark:text-stellar-400"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Save Image
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Social Share */}
          <SocialShare
            title={mockPOAP.name}
            description={`I collected a POAP badge from ${mockPOAP.eventName}!`}
            hashtags={["StellarPass", "POAP", "Stellar", "NFT"]}
          />
        </motion.div>
      </div>
    </div>
  );
}
