"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Calendar,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Users,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

// Mock data - replace with API calls
const mockEvents = [
  {
    id: "1",
    name: "Stellar Summit 2024",
    description: "Annual Stellar blockchain conference",
    date: "2024-06-15",
    venue: "Moscone Center, SF",
    status: "live" as const,
    ticketsSold: 450,
    totalTickets: 500,
    revenue: 22500,
    tiers: 3,
  },
  {
    id: "2",
    name: "DeFi Meetup SF",
    description: "Monthly DeFi community meetup",
    date: "2024-07-20",
    venue: "Galvanize, SF",
    status: "published" as const,
    ticketsSold: 89,
    totalTickets: 200,
    revenue: 4450,
    tiers: 2,
  },
  {
    id: "3",
    name: "Blockchain Workshop",
    description: "Hands-on blockchain development workshop",
    date: "2024-08-10",
    venue: "WeWork, Mission",
    status: "draft" as const,
    ticketsSold: 0,
    totalTickets: 50,
    revenue: 0,
    tiers: 1,
  },
  {
    id: "4",
    name: "Web3 Music Festival",
    description: "Music festival with NFT tickets",
    date: "2024-09-05",
    venue: "Golden Gate Park",
    status: "published" as const,
    ticketsSold: 1200,
    totalTickets: 5000,
    revenue: 180000,
    tiers: 4,
  },
  {
    id: "5",
    name: "Crypto Art Exhibition",
    description: "Digital art showcase with POAP badges",
    date: "2024-04-15",
    venue: "SFMOMA",
    status: "ended" as const,
    ticketsSold: 300,
    totalTickets: 300,
    revenue: 15000,
    tiers: 2,
  },
];

const statusVariant = {
  draft: "draft" as const,
  published: "default" as const,
  live: "live" as const,
  ended: "secondary" as const,
  cancelled: "danger" as const,
};

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "published" | "draft" | "ended">("all");

  const filtered = mockEvents.filter((event) => {
    const matchesSearch =
      search === "" ||
      event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.venue.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || event.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Events
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your events and ticket sales
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "live", "published", "draft", "ended"] as const).map((f) => (
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

      {/* Events Grid */}
      <div className="grid gap-4">
        {filtered.map((event) => (
          <Link
            key={event.id}
            href={`/dashboard/events/${event.id}/overview`}
          >
            <Card hover>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-stellar flex-shrink-0">
                      <Calendar className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {event.name}
                        </h3>
                        <Badge variant={statusVariant[event.status]}>
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.date)}
                        </span>
                        <span>{event.venue}</span>
                        <span>{event.tiers} tiers</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.ticketsSold}/{event.totalTickets}
                          </span>
                        </div>
                        <div className="w-24 mt-1">
                          <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-full rounded-full bg-stellar-500"
                              style={{
                                width: `${
                                  (event.ticketsSold / event.totalTickets) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(event.revenue)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No events found
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {search
                  ? "Try adjusting your search"
                  : "Create your first event to get started"}
              </p>
              {!search && (
                <Link href="/dashboard/events/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
