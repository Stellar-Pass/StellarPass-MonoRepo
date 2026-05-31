"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award, Calendar, ExternalLink, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface POAPItem {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  badgeUrl: string;
  name: string;
  description?: string;
  claimedAt: string;
  txHash?: string;
}

interface POAPGalleryProps {
  poaps: POAPItem[];
  loading?: boolean;
  onShare?: (poapId: string) => void;
  onSelect?: (poapId: string) => void;
}

export function POAPGallery({
  poaps,
  loading = false,
  onShare,
  onSelect,
}: POAPGalleryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (poaps.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4">
          <Award className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          No POAPs Yet
        </h3>
        <p className="text-sm text-gray-500">
          Attend events to collect Proof of Attendance badges
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {poaps.map((poap, index) => (
        <motion.div
          key={poap.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="cursor-pointer"
          onClick={() => onSelect?.(poap.id)}
        >
          <Card className="overflow-hidden group">
            {/* Badge Image */}
            <div className="aspect-square relative overflow-hidden">
              {poap.badgeUrl ? (
                <img
                  src={poap.badgeUrl}
                  alt={poap.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                />
              ) : (
                <div className="h-full w-full bg-gradient-stellar flex items-center justify-center">
                  <Award className="h-16 w-16 text-white/80" />
                </div>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {onShare && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 bg-white/20 hover:bg-white/30 border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShare(poap.id);
                    }}
                  >
                    <Share2 className="h-4 w-4 text-white" />
                  </Button>
                )}
                {poap.txHash && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 bg-white/20 hover:bg-white/30 border-0"
                    asChild
                  >
                    <a
                      href={`https://stellar.expert/explorer/public/tx/${poap.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4 text-white" />
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* Info */}
            <CardContent className="p-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {poap.name}
              </h4>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {poap.eventName}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(poap.eventDate)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
