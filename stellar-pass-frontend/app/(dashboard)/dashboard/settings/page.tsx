"use client";

import React, { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Key,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    ticketSales: true,
    checkIns: false,
    weeklyReport: true,
  });
  const [apiKey] = useState("sp_live_sk_1234567890abcdef");

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const handleCopyApiKey = async () => {
    await navigator.clipboard.writeText(apiKey);
  };

  const handleRegenerateKey = async () => {
    if (confirm("Are you sure? This will invalidate your current API key.")) {
      // API call to regenerate
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Account Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account preferences and API access
        </p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries({
            email: "Email notifications",
            ticketSales: "Ticket sale alerts",
            checkIns: "Check-in notifications",
            weeklyReport: "Weekly analytics report",
          }).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-800"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {label}
              </span>
              <button
                onClick={() =>
                  setNotifications((prev) => ({
                    ...prev,
                    [key]: !prev[key as keyof typeof prev],
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications[key as keyof typeof notifications]
                    ? "bg-stellar-600"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    notifications[key as keyof typeof notifications]
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Use API keys to integrate Stellar Pass with your applications.
          </p>

          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="success">Live</Badge>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Production Key
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCopyApiKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
              {showApiKey ? apiKey : "••••••••••••••••••••••••"}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerateKey}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate Key
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Two-Factor Authentication
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Add an extra layer of security to your account
            </p>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>

          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Session Management
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              View and manage your active sessions
            </p>
            <Button variant="outline" size="sm">
              Manage Sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger-200 dark:border-danger-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger-600">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-950">
            <h3 className="text-sm font-medium text-danger-700 dark:text-danger-300 mb-1">
              Delete Account
            </h3>
            <p className="text-xs text-danger-600 dark:text-danger-400 mb-3">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            <Button variant="danger" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
