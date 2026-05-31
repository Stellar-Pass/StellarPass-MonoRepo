"use client";

import React, { useState } from "react";
import { LiveCheckIn } from "@/components/dashboard/LiveCheckIn";

// Mock data - replace with API calls
const mockStats = {
  checkedIn: 380,
  total: 450,
};

export default function EventCheckInPage() {
  const handleCheckIn = async (ticketId: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock validation
    if (ticketId.startsWith("valid")) {
      return {
        success: true,
        message: "Ticket validated successfully",
        attendeeName: "John Doe",
        tierName: "VIP",
      };
    }

    return {
      success: false,
      message: "Invalid ticket ID",
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Live Check-in
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Scan QR codes or enter ticket IDs manually to check in attendees
        </p>
      </div>

      <LiveCheckIn
        eventId="1"
        onCheckIn={handleCheckIn}
        stats={mockStats}
      />
    </div>
  );
}
