"use client";

import React, { useState } from "react";
import { POAPConfig } from "@/components/dashboard/POAPConfig";

// Mock data - replace with API calls
const mockSettings = {
  enabled: true,
  badgeUrl: "https://ipfs.io/ipfs/QmExample",
  claimDeadline: "2024-07-01T23:59",
  autoMint: true,
  name: "Stellar Summit 2024 Attendance",
  description: "Proof of attendance for Stellar Summit 2024",
};

const mockStats = {
  total: 450,
  claimed: 320,
  unclaimed: 130,
};

export default function EventPOAPPage() {
  const [settings, setSettings] = useState(mockSettings);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (newSettings: typeof mockSettings) => {
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSettings(newSettings);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          POAP Configuration
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure Proof of Attendance Protocol badges for your event
        </p>
      </div>

      <POAPConfig
        settings={settings}
        stats={mockStats}
        onUpdate={handleUpdate}
        loading={loading}
      />
    </div>
  );
}
