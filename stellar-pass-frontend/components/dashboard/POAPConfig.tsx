"use client";

import React, { useState } from "react";
import {
  Award,
  Upload,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Settings,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface POAPSettings {
  enabled: boolean;
  badgeUrl: string;
  claimDeadline: string;
  autoMint: boolean;
  name: string;
  description: string;
}

interface POAPStats {
  total: number;
  claimed: number;
  unclaimed: number;
}

interface POAPConfigProps {
  settings: POAPSettings;
  stats: POAPStats;
  onUpdate: (settings: POAPSettings) => void;
  loading?: boolean;
}

export function POAPConfig({
  settings,
  stats,
  onUpdate,
  loading = false,
}: POAPConfigProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<POAPSettings>(settings);

  const handleSave = () => {
    onUpdate(form);
    setEditing(false);
  };

  const handleToggle = () => {
    const updated = { ...settings, enabled: !settings.enabled };
    onUpdate(updated);
    setForm(updated);
  };

  const claimedPercentage =
    stats.total > 0 ? (stats.claimed / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-950">
              <Award className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
              </p>
              <p className="text-xs text-gray-500">Total POAPs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 dark:bg-success-950">
              <CheckCircle className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.claimed}
              </p>
              <p className="text-xs text-gray-500">Claimed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.unclaimed}
              </p>
              <p className="text-xs text-gray-500">Unclaimed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claim Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Claim Progress
            </h3>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {Math.round(claimedPercentage)}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-500 to-stellar-500 transition-all"
              style={{ width: `${claimedPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{stats.claimed} claimed</span>
            <span>{stats.unclaimed} remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              POAP Configuration
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={settings.enabled ? "success" : "secondary"}>
                {settings.enabled ? "Enabled" : "Disabled"}
              </Badge>
              <button
                onClick={handleToggle}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  settings.enabled
                    ? "bg-stellar-600"
                    : "bg-gray-200 dark:bg-gray-700"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                    settings.enabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        </CardHeader>

        {settings.enabled && (
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <Input
                  label="POAP Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g., Stellar Summit 2024 Attendance"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Description
                  </label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-stellar-500"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Describe what this POAP represents..."
                  />
                </div>

                <Input
                  label="Badge Image URL"
                  value={form.badgeUrl}
                  onChange={(e) =>
                    setForm({ ...form, badgeUrl: e.target.value })
                  }
                  placeholder="https://ipfs.io/ipfs/..."
                  leftIcon={<Upload className="h-4 w-4" />}
                  helperText="Upload your badge image to IPFS and paste the URL"
                />

                <Input
                  label="Claim Deadline"
                  type="datetime-local"
                  value={form.claimDeadline}
                  onChange={(e) =>
                    setForm({ ...form, claimDeadline: e.target.value })
                  }
                  leftIcon={<Calendar className="h-4 w-4" />}
                />

                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Auto-Mint
                    </h4>
                    <p className="text-xs text-gray-500">
                      Automatically mint POAP when ticket is checked in
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setForm({ ...form, autoMint: !form.autoMint })
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      form.autoMint
                        ? "bg-stellar-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                        form.autoMint ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSave} loading={loading}>
                    Save Changes
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setForm(settings);
                      setEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {settings.name || "Not set"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Claim Deadline</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {settings.claimDeadline
                        ? new Date(settings.claimDeadline).toLocaleDateString()
                        : "No deadline"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Auto-Mint</p>
                    <Badge variant={settings.autoMint ? "success" : "secondary"}>
                      {settings.autoMint ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Badge</p>
                    {settings.badgeUrl ? (
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <img
                            src={settings.badgeUrl}
                            alt="Badge"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="text-xs text-gray-500">Uploaded</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Not uploaded</p>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setEditing(true)}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Edit POAP Settings
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
