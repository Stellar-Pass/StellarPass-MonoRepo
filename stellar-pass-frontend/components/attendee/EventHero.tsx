"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDate, formatDateTime, getTimeRemaining } from "@/lib/utils";

interface EventHeroProps {
  name: string;
  description: string;
  date: string;
  endDate?: string;
  venue: string;
  location?: string;
  imageUrl?: string;
  organizerName?: string;
  organizerAddress?: string;
  ticketsSold: number;
  totalTickets: number;
  status: "draft" | "published" | "live" | "ended" | "cancelled";
  onShare?: () => void;
}

export function EventHero({
  name,
  description,
  date,
  endDate,
  venue,
  location,
  imageUrl,
  organizerName,
  organizerAddress,
  ticketsSold,
  totalTickets,
  status,
  onShare,
}: EventHeroProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(date));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(date));
    }, 1000);
    return () => clearInterval(timer);
  }, [date]);

  const statusVariant = {
    draft: "draft" as const,
    published: "default" as const,
    live: "live" as const,
    ended: "secondary" as const,
    cancelled: "danger" as const,
  };

  const statusLabel = {
    draft: "Draft",
    published: "Upcoming",
    live: "Happening Now",
    ended: "Ended",
    cancelled: "Cancelled",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-stellar">
      {/* Background Image */}
      {imageUrl && (
        <div className="absolute inset-0">
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stellar-950 via-stellar-950/80 to-stellar-950/40" />
        </div>
      )}

      {/* Gradient Overlay (no image) */}
      {!imageUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-stellar-600 via-accent-700 to-stellar-900 opacity-90" />
      )}

      {/* Content */}
      <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl">
          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Badge variant={statusVariant[status]} className="mb-4">
              {status === "live" && (
                <span className="mr-1.5 h-2 w-2 rounded-full bg-current animate-pulse" />
              )}
              {statusLabel[status]}
            </Badge>
          </motion.div>

          {/* Event Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-display"
          >
            {name}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-base sm:text-lg text-white/80 mb-6 max-w-2xl line-clamp-3"
          >
            {description}
          </motion.p>

          {/* Event Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4 mb-8 text-white/90"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-white/60" />
              <span className="text-sm font-medium">{formatDate(date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-white/60" />
              <span className="text-sm font-medium">
                {new Date(date).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {endDate &&
                  ` - ${new Date(endDate).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-white/60" />
              <span className="text-sm font-medium">
                {venue}
                {location && `, ${location}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-white/60" />
              <span className="text-sm font-medium">
                {ticketsSold}/{totalTickets} tickets sold
              </span>
            </div>
          </motion.div>

          {/* Countdown Timer (if event hasn't started) */}
          {!timeLeft.expired && status !== "ended" && status !== "cancelled" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex gap-4 mb-8"
            >
              {[
                { value: timeLeft.days, label: "Days" },
                { value: timeLeft.hours, label: "Hours" },
                { value: timeLeft.minutes, label: "Minutes" },
                { value: timeLeft.seconds, label: "Seconds" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[70px]"
                >
                  <span className="text-2xl font-bold text-white font-mono">
                    {String(item.value).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-white/60 uppercase">
                    {item.label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap gap-3"
          >
            {onShare && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onShare}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </motion.div>

          {/* Organizer */}
          {organizerName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 pt-6 border-t border-white/10"
            >
              <p className="text-sm text-white/60">Organized by</p>
              <p className="text-white font-medium">{organizerName}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
