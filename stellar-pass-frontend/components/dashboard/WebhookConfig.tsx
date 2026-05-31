"use client";

import React, { useState } from "react";
import {
  Webhook,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  lastDelivery?: {
    status: number;
    timestamp: string;
    success: boolean;
  };
  createdAt: string;
}

interface WebhookConfigProps {
  webhooks: WebhookEndpoint[];
  onAdd: (url: string, events: string[]) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onTest: (id: string) => Promise<void>;
  loading?: boolean;
}

const AVAILABLE_EVENTS = [
  { id: "ticket.purchased", label: "Ticket Purchased" },
  { id: "ticket.checked_in", label: "Ticket Checked In" },
  { id: "ticket.transferred", label: "Ticket Transferred" },
  { id: "poap.claimed", label: "POAP Claimed" },
  { id: "event.published", label: "Event Published" },
  { id: "event.ended", label: "Event Ended" },
];

export function WebhookConfig({
  webhooks,
  onAdd,
  onRemove,
  onTest,
  loading = false,
}: WebhookConfigProps) {
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newUrl || selectedEvents.length === 0) return;
    setSubmitting(true);
    try {
      await onAdd(newUrl, selectedEvents);
      setNewUrl("");
      setSelectedEvents([]);
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await onTest(id);
    } finally {
      setTestingId(null);
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Webhooks
          </h3>
          <p className="text-sm text-gray-500">
            Receive real-time notifications for event activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Endpoint
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Input
              label="Endpoint URL"
              placeholder="https://your-server.com/webhooks/stellar-pass"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              leftIcon={<Webhook className="h-4 w-4" />}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Events
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_EVENTS.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                      selectedEvents.includes(event.id)
                        ? "border-stellar-500 bg-stellar-50 text-stellar-700 dark:bg-stellar-950 dark:text-stellar-300"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400"
                    )}
                  >
                    {selectedEvents.includes(event.id) && (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    {event.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                loading={submitting}
                disabled={!newUrl || selectedEvents.length === 0}
              >
                Add Webhook
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook List */}
      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Webhook className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500">No webhooks configured</p>
              <p className="text-sm text-gray-400 mt-1">
                Add an endpoint to receive real-time notifications
              </p>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full",
                          webhook.active ? "bg-success-500" : "bg-gray-300"
                        )}
                      />
                      <p className="text-sm font-mono text-gray-900 dark:text-white truncate">
                        {webhook.url}
                      </p>
                      <a
                        href={webhook.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="secondary" className="text-[10px]">
                          {event}
                        </Badge>
                      ))}
                    </div>

                    {webhook.lastDelivery && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {webhook.lastDelivery.success ? (
                          <CheckCircle className="h-3.5 w-3.5 text-success-500" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-danger-500" />
                        )}
                        <span>
                          Last delivery: {webhook.lastDelivery.status} •{" "}
                          {new Date(
                            webhook.lastDelivery.timestamp
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleTest(webhook.id)}
                      disabled={testingId === webhook.id}
                      title="Test webhook"
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          testingId === webhook.id && "animate-spin"
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(webhook.id)}
                      className="text-danger-500 hover:text-danger-700 hover:bg-danger-50"
                      title="Remove webhook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
