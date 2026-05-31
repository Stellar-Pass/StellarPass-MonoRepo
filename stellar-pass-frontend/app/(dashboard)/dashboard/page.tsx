"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Ticket,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Plus,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

// Mock data - replace with API calls
const mockStats = {
  totalEvents: 12,
  totalTicketsSold: 1247,
  totalRevenue: 45890,
  totalCheckIns: 892,
};

const mockRecentEvents = [
  {
    id: "1",
    name: "Stellar Summit 2024",
    date: "2024-06-15",
    status: "live" as const,
    ticketsSold: 450,
    totalTickets: 500,
    revenue: 22500,
  },
  {
    id: "2",
    name: "DeFi Meetup SF",
    date: "2024-07-20",
    status: "published" as const,
    ticketsSold: 89,
    totalTickets: 200,
    revenue: 4450,
  },
  {
    id: "3",
    name: "Blockchain Workshop",
    date: "2024-08-10",
    status: "draft" as const,
    ticketsSold: 0,
    totalTickets: 50,
    revenue: 0,
  },
];

const statusVariant = {
  draft: "draft" as const,
  published: "default" as const,
  live: "live" as const,
  ended: "secondary" as const,
  cancelled: "danger" as const,
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back! Here&apos;s an overview of your events.
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {mockStats.totalEvents}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stellar-50 dark:bg-stellar-950">
                <Calendar className="h-6 w-6 text-stellar-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp className="h-3 w-3 text-success-500" />
              <span className="text-xs text-success-600">+2 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tickets Sold</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {mockStats.totalTicketsSold.toLocaleString()}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-950">
                <Ticket className="h-6 w-6 text-accent-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp className="h-3 w-3 text-success-500" />
              <span className="text-xs text-success-600">+124 this week</span>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(mockStats.totalRevenue)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 dark:bg-success-950">
                <DollarSign className="h-6 w-6 text-success-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <TrendingUp className="h-3 w-3 text-success-500" />
              <span className="text-xs text-success-600">+5,230 XLM this week</span>
            </div>
          </CardContent>
        </Card>

        <Card hover>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Check-ins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {mockStats.totalCheckIns.toLocaleString()}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 dark:bg-yellow-950">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <span className="text-xs text-gray-500">
                {Math.round((mockStats.totalCheckIns / mockStats.totalTicketsSold) * 100)}% check-in rate
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Events</CardTitle>
            <Link href="/dashboard/events">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/dashboard/events/${event.id}/overview`}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-stellar">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {event.name}
                      </h3>
                      <Badge variant={statusVariant[event.status]}>
                        {event.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {event.ticketsSold}/{event.totalTickets} tickets
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(event.revenue)} revenue
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/events/new">
          <Card hover className="cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stellar-50 dark:bg-stellar-950">
                <Plus className="h-6 w-6 text-stellar-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Create Event
                </h3>
                <p className="text-sm text-gray-500">
                  Set up a new event with tickets
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/scan">
          <Card hover className="cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 dark:bg-success-950">
                <Users className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Open Scanner
                </h3>
                <p className="text-sm text-gray-500">
                  Check in attendees at the venue
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/profile">
          <Card hover className="cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-950">
                <Clock className="h-6 w-6 text-accent-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  View Profile
                </h3>
                <p className="text-sm text-gray-500">
                  Manage your organizer profile
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
