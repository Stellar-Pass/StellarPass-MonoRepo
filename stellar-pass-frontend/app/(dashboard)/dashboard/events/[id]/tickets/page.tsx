"use client";

import React, { useState } from "react";
import { TicketTierEditor } from "@/components/dashboard/TicketTierEditor";

// Mock data - replace with API calls
const mockTiers = [
  {
    id: "1",
    name: "General Admission",
    price: "50",
    supply: 250,
    sold: 200,
    description: "Standard event access",
    transferable: true,
    maxPerWallet: 5,
    saleStartDate: "2024-01-01T00:00",
    saleEndDate: "2024-06-14T23:59",
  },
  {
    id: "2",
    name: "VIP",
    price: "150",
    supply: 150,
    sold: 150,
    description: "Premium access with exclusive perks",
    transferable: true,
    maxPerWallet: 2,
    saleStartDate: "2024-01-01T00:00",
    saleEndDate: "2024-06-14T23:59",
  },
  {
    id: "3",
    name: "Early Bird",
    price: "35",
    supply: 100,
    sold: 100,
    description: "Discounted early access tickets",
    transferable: false,
    maxPerWallet: 3,
    saleStartDate: "2024-01-01T00:00",
    saleEndDate: "2024-02-01T23:59",
  },
];

export default function EventTicketsPage() {
  const [tiers, setTiers] = useState(mockTiers);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Ticket Tiers
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure your ticket types, pricing, and availability
        </p>
      </div>

      <TicketTierEditor
        tiers={tiers}
        onUpdate={setTiers}
        eventId="1"
      />
    </div>
  );
}
