"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrency } from "@/lib/utils";

interface SalesDataPoint {
  date: string;
  revenue: number;
  tickets: number;
  checkIns: number;
}

interface SalesChartProps {
  data: SalesDataPoint[];
  loading?: boolean;
}

type ChartView = "revenue" | "tickets" | "checkIns";
type ChartType = "area" | "bar";
type TimeRange = "7d" | "30d" | "all";

const COLORS = {
  revenue: { stroke: "#4263eb", fill: "#dbe4ff" },
  tickets: { stroke: "#7048e8", fill: "#d0bfff" },
  checkIns: { stroke: "#40c057", fill: "#d3f9d8" },
};

export function SalesChart({ data, loading = false }: SalesChartProps) {
  const [view, setView] = useState<ChartView>("revenue");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const filteredData = (() => {
    if (timeRange === "all") return data;
    const days = timeRange === "7d" ? 7 : 30;
    return data.slice(-days);
  })();

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalTickets = data.reduce((sum, d) => sum + d.tickets, 0);
  const totalCheckIns = data.reduce((sum, d) => sum + d.checkIns, 0);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: string;
  }) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-lg">
        <p className="text-xs text-gray-500 mb-2">{label}</p>
        {payload.map((item, i) => (
          <p key={i} className="text-sm font-medium text-gray-900 dark:text-white">
            {view === "revenue"
              ? formatCurrency(item.value)
              : item.value.toLocaleString()}{" "}
            <span className="text-gray-500">{item.name}</span>
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-80 flex items-center justify-center">
            <div className="animate-pulse space-y-4 w-full">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
              <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Sales Overview</CardTitle>
          <div className="flex flex-wrap gap-2">
            {/* View Toggle */}
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
              {(["revenue", "tickets", "checkIns"] as ChartView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    view === v
                      ? "bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  {v === "checkIns" ? "Check-ins" : v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Time Range */}
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
              {(["7d", "30d", "all"] as TimeRange[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    timeRange === t
                      ? "bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-gray-500">Total Revenue</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalTickets.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Tickets Sold</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalCheckIns.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Check-ins</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id={`gradient-${view}`} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS[view].stroke}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS[view].stroke}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-800"
                />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "#9ca3af" }}
                  tickLine={false}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "#9ca3af" }}
                  tickLine={false}
                  tickFormatter={(v) =>
                    view === "revenue" ? `${v} XLM` : v.toString()
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey={view}
                  stroke={COLORS[view].stroke}
                  strokeWidth={2}
                  fill={`url(#gradient-${view})`}
                />
              </AreaChart>
            ) : (
              <BarChart data={filteredData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-800"
                />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "#9ca3af" }}
                  tickLine={false}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "#9ca3af" }}
                  tickLine={false}
                  tickFormatter={(v) =>
                    view === "revenue" ? `${v} XLM` : v.toString()
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={view}
                  fill={COLORS[view].stroke}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Chart Type Toggle */}
        <div className="flex justify-center mt-4">
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
            <button
              onClick={() => setChartType("area")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                chartType === "area"
                  ? "bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Area
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                chartType === "bar"
                  ? "bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Bar
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
