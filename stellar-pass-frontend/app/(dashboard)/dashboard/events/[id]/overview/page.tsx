"use client";

import React from "react";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  DollarSign,
  Ticket,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock data - replace with API calls
const mockAnalytics = {
  totalTickets: 500,
  ticketsSold: 450,
  totalRevenue: 22500,
  checkedIn: 380,
  checkInRate: 84.4,
  averageOrderValue: 50,
};

const mockSalesData = [
  { date: "Jan 1", revenue: 1200, tickets: 24, checkIns: 0 },
  { date: "Jan 8", revenue: 2400, tickets: 48, checkIns: 0 },
  { date: "Jan 15", revenue: 3600, tickets: 72, checkIns: 0 },
  { date: "Jan 22", revenue: 4800, tickets: 96, checkIns: 0 },
  { date: "Feb 1", revenue: 6000, tickets: 120, checkIns: 0 },
  { date: "Feb 8", revenue: 8400, tickets: 168, checkIns: 0 },
  { date: "Feb 15", revenue: 10800, tickets: 216, checkIns: 0 },
  { date: "Feb 22", revenue: 13200, tickets: 264, checkIns: 0 },
  { date: "Mar 1", revenue: 15600, tickets: 312, checkIns: 100 },
  { date: "Mar 8", revenue: 18000, tickets: 360, checkIns: 200 },
  { date: "Mar 15", revenue: 20400, tickets: 408, checkIns: 300 },
  { date: "Mar 22", revenue: 22500, tickets: 450, checkIns: 380 },
];

const mockTierBreakdown = [
  { name: "General Admission", sold: 200, total: 250, revenue: 10000 },
  { name: "VIP", sold: 150, total: 150, revenue: 7500 },
  { name: "Early Bird", sold: 100, total: 100, revenue: 5000 },
];

export default function EventOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stellar-50 dark:bg-stellar-950">
              <Ticket className="h-6 w-6 text-stellar-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockAnalytics.ticketsSold}
              </p>
              <p className="text-xs text-gray-500">
                of {mockAnalytics.totalTickets} tickets
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-50 dark:bg-success-950">
              <DollarSign className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(mockAnalytics.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500">Total revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-950">
              <CheckCircle className="h-6 w-6 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockAnalytics.checkedIn}
              </p>
              <p className="text-xs text-gray-500">
                {mockAnalytics.checkInRate}% check-in rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50 dark:bg-yellow-950">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(mockAnalytics.averageOrderValue)}
              </p>
              <p className="text-xs text-gray-500">Avg. order value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <SalesChart data={mockSalesData} />

      {/* Tier Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTierBreakdown.map((tier) => {
              const percentage = (tier.sold / tier.total) * 100;
              return (
                <div
                  key={tier.name}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {tier.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {tier.sold}/{tier.total} sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(tier.revenue)}
                      </p>
                      <Badge
                        variant={percentage === 100 ? "danger" : "default"}
                      >
                        {percentage === 100 ? "Sold Out" : `${Math.round(percentage)}%`}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-stellar transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
