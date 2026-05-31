"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { EventWizard } from "@/components/dashboard/EventWizard";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import type { CreateEventData } from "@/lib/api";

export default function NewEventPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateEventData) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await api.createEvent(data, token);
      if (response.error) {
        throw new Error(response.error);
      }
      router.push("/dashboard/events");
    } catch (error) {
      console.error("Failed to create event:", error);
      alert(error instanceof Error ? error.message : "Failed to create event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Create New Event
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to create your event and configure ticket
          tiers.
        </p>
      </div>

      <EventWizard onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
