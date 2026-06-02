"use client";

import React, { useState } from "react";
import { WebhookConfig } from "@/components/dashboard/WebhookConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  Globe,
  Palette,
  DollarSign,
  Save,
  Upload,
  Trash2,
} from "lucide-react";

// Mock data - replace with API calls
const mockWebhooks = [
  {
    id: "1",
    url: "https://api.example.com/webhooks/stellar-pass",
    events: ["ticket.purchased", "ticket.checked_in"],
    active: true,
    lastDelivery: {
      status: 200,
      timestamp: "2024-03-15T10:30:00Z",
      success: true,
    },
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "2",
    url: "https://notifications.example.com/hooks",
    events: ["poap.claimed"],
    active: true,
    lastDelivery: {
      status: 200,
      timestamp: "2024-03-14T15:45:00Z",
      success: true,
    },
    createdAt: "2024-02-01T00:00:00Z",
  },
];

export default function EventSettingsPage() {
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [branding, setBranding] = useState({
    primaryColor: "#4263eb",
    logoUrl: "",
    bannerUrl: "",
  });
  const [payout, setPayout] = useState({
    address: "",
    autoWithdraw: false,
    threshold: "1000",
  });
  const [saving, setSaving] = useState(false);

  const handleAddWebhook = async (url: string, events: string[]) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setWebhooks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        url,
        events,
        active: true,
        lastDelivery: {
          status: 0,
          timestamp: new Date().toISOString(),
          success: false,
        },
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleRemoveWebhook = async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const handleTestWebhook = async (id: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Event Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure webhooks, branding, and payout settings
        </p>
      </div>

      {/* Webhooks */}
      <WebhookConfig
        webhooks={webhooks}
        onAdd={handleAddWebhook}
        onRemove={handleRemoveWebhook}
        onTest={handleTestWebhook}
      />

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Primary Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) =>
                    setBranding({ ...branding, primaryColor: e.target.value })
                  }
                  className="h-11 w-11 rounded-lg border border-gray-300 cursor-pointer"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) =>
                    setBranding({ ...branding, primaryColor: e.target.value })
                  }
                  placeholder="#4263eb"
                />
              </div>
            </div>

            <Input
              label="Logo URL"
              value={branding.logoUrl}
              onChange={(e) =>
                setBranding({ ...branding, logoUrl: e.target.value })
              }
              placeholder="https://..."
              leftIcon={<Upload className="h-4 w-4" />}
            />
          </div>

          <Input
            label="Banner Image URL"
            value={branding.bannerUrl}
            onChange={(e) =>
              setBranding({ ...branding, bannerUrl: e.target.value })
            }
            placeholder="https://..."
            leftIcon={<Upload className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Payout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payout Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Payout Address"
            value={payout.address}
            onChange={(e) =>
              setPayout({ ...payout, address: e.target.value })
            }
            placeholder="Your Stellar address for receiving payouts"
            leftIcon={<Globe className="h-4 w-4" />}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Auto-withdraw Threshold (XLM)"
              type="number"
              value={payout.threshold}
              onChange={(e) =>
                setPayout({ ...payout, threshold: e.target.value })
              }
              placeholder="1000"
              helperText="Automatically withdraw when balance exceeds this amount"
            />

            <div className="flex items-center gap-3 pt-6">
              <button
                onClick={() =>
                  setPayout({ ...payout, autoWithdraw: !payout.autoWithdraw })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  payout.autoWithdraw
                    ? "bg-stellar-600"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    payout.autoWithdraw ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enable auto-withdraw
              </span>
            </div>
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
