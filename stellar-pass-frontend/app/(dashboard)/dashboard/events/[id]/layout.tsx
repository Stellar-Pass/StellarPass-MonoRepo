"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Ticket,
  ScanLine,
  Award,
  Settings,
  ArrowLeft,
  Calendar,
  ExternalLink,
  Copy,
  MoreVertical,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDate, truncateAddress } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";

// Mock event data - replace with API call
const mockEvent = {
  id: "1",
  name: "Stellar Summit 2024",
  date: "2024-06-15",
  venue: "Moscone Center, SF",
  status: "live" as const,
  slug: "stellar-summit-2024",
};

const iconMap = {
  BarChart3,
  Ticket,
  ScanLine,
  Award,
  Settings,
};

export default function EventDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();
  const event = mockEvent; // Replace with API call using params.id

  const isActive = (href: string) => {
    return pathname.endsWith(href);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Event Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-stellar">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {event.name}
                  </h1>
                  <Badge variant={event.status === "live" ? "live" : "default"}>
                    {event.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(event.date)} · {event.venue}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/event/${event.slug}`}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Public Page
                </Link>
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="flex gap-1 -mb-px">
          {NAV_LINKS.event.map((tab) => {
            const Icon = iconMap[tab.icon as keyof typeof iconMap];
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={`/dashboard/events/${params.id}/${tab.href}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  active
                    ? "border-stellar-600 text-stellar-600 dark:border-stellar-400 dark:text-stellar-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div>{children}</div>
    </div>
  );
}
