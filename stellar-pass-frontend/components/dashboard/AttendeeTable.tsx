"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, truncateAddress } from "@/lib/utils";

interface Attendee {
  id: string;
  walletAddress: string;
  name?: string;
  email?: string;
  tierName: string;
  tierId: string;
  checkedIn: boolean;
  checkedInAt?: string;
  purchasedAt: string;
  ticketId: string;
}

interface AttendeeTableProps {
  attendees: Attendee[];
  loading?: boolean;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  pageSize?: number;
}

export function AttendeeTable({
  attendees,
  loading = false,
  totalCount = 0,
  onPageChange,
  currentPage = 1,
  pageSize = 20,
}: AttendeeTableProps) {
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "checkedIn" | "notCheckedIn">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const tiers = useMemo(() => {
    const tierSet = new Set(attendees.map((a) => a.tierName));
    return Array.from(tierSet);
  }, [attendees]);

  const filtered = useMemo(() => {
    return attendees.filter((attendee) => {
      const matchesSearch =
        search === "" ||
        attendee.name?.toLowerCase().includes(search.toLowerCase()) ||
        attendee.walletAddress.toLowerCase().includes(search.toLowerCase()) ||
        attendee.email?.toLowerCase().includes(search.toLowerCase()) ||
        attendee.ticketId.toLowerCase().includes(search.toLowerCase());

      const matchesTier =
        filterTier === "all" || attendee.tierName === filterTier;

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "checkedIn" && attendee.checkedIn) ||
        (filterStatus === "notCheckedIn" && !attendee.checkedIn);

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [attendees, search, filterTier, filterStatus]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Wallet", "Email", "Tier", "Checked In", "Purchased At", "Ticket ID"].join(","),
      ...filtered.map((a) =>
        [
          a.name || "",
          a.walletAddress,
          a.email || "",
          a.tierName,
          a.checkedIn ? "Yes" : "No",
          a.purchasedAt,
          a.ticketId,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendees.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>
            Attendees ({filtered.length}
            {totalCount !== filtered.length && ` of ${totalCount}`})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, wallet, email, or ticket ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="all">All Tiers</option>
            {tiers.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(e.target.value as "all" | "checkedIn" | "notCheckedIn")
            }
            className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-950"
          >
            <option value="all">All Status</option>
            <option value="checkedIn">Checked In</option>
            <option value="notCheckedIn">Not Checked In</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendee
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchased
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((attendee) => (
                <tr
                  key={attendee.id}
                  className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {attendee.name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-xs text-gray-500 font-mono">
                          {truncateAddress(attendee.walletAddress)}
                        </p>
                        <button
                          onClick={() =>
                            handleCopy(attendee.walletAddress, attendee.id)
                          }
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {copiedId === attendee.id ? (
                            <CheckCircle className="h-3 w-3 text-success-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      {attendee.email && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {attendee.email}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">{attendee.tierName}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    {attendee.checkedIn ? (
                      <Badge variant="success">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Checked In
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(attendee.purchasedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(attendee.purchasedAt).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={`/tickets/${attendee.ticketId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No attendees found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && onPageChange && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
