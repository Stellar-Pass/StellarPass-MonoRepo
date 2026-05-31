"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  FileText,
  Ticket,
  Award,
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { CreateEventData } from "@/lib/api";

interface EventWizardProps {
  onSubmit: (data: CreateEventData) => Promise<void>;
  loading?: boolean;
}

interface TicketTier {
  id: string;
  name: string;
  price: string;
  supply: number;
  description: string;
  transferable: boolean;
}

const STEPS = [
  { id: 1, title: "Basic Info", icon: FileText },
  { id: 2, title: "Date & Venue", icon: Calendar },
  { id: 3, title: "Ticket Tiers", icon: Ticket },
  { id: 4, title: "POAP Settings", icon: Award },
  { id: 5, title: "Review", icon: Check },
];

export function EventWizard({ onSubmit, loading = false }: EventWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreateEventData>>({
    name: "",
    description: "",
    date: "",
    endDate: "",
    venue: "",
    location: "",
    imageUrl: "",
    tiers: [],
    poap: { enabled: false },
  });
  const [tiers, setTiers] = useState<TicketTier[]>([
    {
      id: crypto.randomUUID(),
      name: "General Admission",
      price: "10",
      supply: 100,
      description: "",
      transferable: true,
    },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(
    (field: keyof CreateEventData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    []
  );

  const addTier = useCallback(() => {
    setTiers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        price: "0",
        supply: 50,
        description: "",
        transferable: true,
      },
    ]);
  }, []);

  const removeTier = useCallback((id: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateTier = useCallback(
    (id: string, field: keyof TicketTier, value: string | number | boolean) => {
      setTiers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
      );
    },
    []
  );

  const validateStep = useCallback(
    (step: number): boolean => {
      const newErrors: Record<string, string> = {};

      if (step === 1) {
        if (!formData.name?.trim()) newErrors.name = "Event name is required";
        if (!formData.description?.trim())
          newErrors.description = "Description is required";
      }

      if (step === 2) {
        if (!formData.date) newErrors.date = "Start date is required";
        if (!formData.venue?.trim()) newErrors.venue = "Venue is required";
      }

      if (step === 3) {
        if (tiers.length === 0)
          newErrors.tiers = "At least one ticket tier is required";
        tiers.forEach((tier, i) => {
          if (!tier.name.trim())
            newErrors[`tier_${i}_name`] = "Tier name is required";
          if (parseFloat(tier.price) < 0)
            newErrors[`tier_${i}_price`] = "Price must be positive";
          if (tier.supply <= 0)
            newErrors[`tier_${i}_supply`] = "Supply must be positive";
        });
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData, tiers]
  );

  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    const data: CreateEventData = {
      name: formData.name || "",
      description: formData.description || "",
      date: formData.date || "",
      endDate: formData.endDate,
      venue: formData.venue || "",
      location: formData.location,
      imageUrl: formData.imageUrl,
      tiers: tiers.map(({ id, ...tier }) => tier),
      poap: formData.poap,
    };
    await onSubmit(data);
  }, [formData, tiers, onSubmit]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Basic Information
              </h2>
              <p className="text-sm text-gray-500">
                Tell us about your event
              </p>
            </div>

            <Input
              label="Event Name"
              placeholder="e.g., Stellar Summit 2024"
              value={formData.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              error={errors.name}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description
              </label>
              <textarea
                className={cn(
                  "flex min-h-[120px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm transition-colors",
                  "placeholder:text-gray-400",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stellar-500 focus-visible:border-transparent",
                  "dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100",
                  errors.description && "border-danger-500"
                )}
                placeholder="Describe your event..."
                value={formData.description || ""}
                onChange={(e) => updateField("description", e.target.value)}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-danger-600">{errors.description}</p>
              )}
            </div>

            <Input
              label="Event Image URL"
              placeholder="https://example.com/image.jpg"
              value={formData.imageUrl || ""}
              onChange={(e) => updateField("imageUrl", e.target.value)}
              helperText="Paste a URL for your event banner image"
              leftIcon={<Upload className="h-4 w-4" />}
            />
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Date & Venue
              </h2>
              <p className="text-sm text-gray-500">
                When and where is your event?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={formData.date || ""}
                onChange={(e) => updateField("date", e.target.value)}
                error={errors.date}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
              <Input
                label="End Date & Time (Optional)"
                type="datetime-local"
                value={formData.endDate || ""}
                onChange={(e) => updateField("endDate", e.target.value)}
                leftIcon={<Calendar className="h-4 w-4" />}
              />
            </div>

            <Input
              label="Venue"
              placeholder="e.g., Moscone Center"
              value={formData.venue || ""}
              onChange={(e) => updateField("venue", e.target.value)}
              error={errors.venue}
              leftIcon={<MapPin className="h-4 w-4" />}
            />

            <Input
              label="Location / Address"
              placeholder="e.g., San Francisco, CA"
              value={formData.location || ""}
              onChange={(e) => updateField("location", e.target.value)}
              leftIcon={<MapPin className="h-4 w-4" />}
            />
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                  Ticket Tiers
                </h2>
                <p className="text-sm text-gray-500">
                  Configure your ticket types and pricing
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={addTier}>
                <Plus className="h-4 w-4 mr-1" />
                Add Tier
              </Button>
            </div>

            {errors.tiers && (
              <p className="text-sm text-danger-600">{errors.tiers}</p>
            )}

            <div className="space-y-4">
              {tiers.map((tier, index) => (
                <Card key={tier.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        Tier {index + 1}
                      </Badge>
                      {tiers.length > 1 && (
                        <button
                          onClick={() => removeTier(tier.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        label="Tier Name"
                        placeholder="e.g., VIP"
                        value={tier.name}
                        onChange={(e) =>
                          updateTier(tier.id, "name", e.target.value)
                        }
                        error={errors[`tier_${index}_name`]}
                      />
                      <Input
                        label="Price (XLM)"
                        type="number"
                        placeholder="10"
                        value={tier.price}
                        onChange={(e) =>
                          updateTier(tier.id, "price", e.target.value)
                        }
                        error={errors[`tier_${index}_price`]}
                      />
                      <Input
                        label="Supply"
                        type="number"
                        placeholder="100"
                        value={tier.supply.toString()}
                        onChange={(e) =>
                          updateTier(
                            tier.id,
                            "supply",
                            parseInt(e.target.value) || 0
                          )
                        }
                        error={errors[`tier_${index}_supply`]}
                      />
                    </div>

                    <div className="mt-4">
                      <Input
                        label="Description (Optional)"
                        placeholder="What's included in this tier?"
                        value={tier.description}
                        onChange={(e) =>
                          updateTier(tier.id, "description", e.target.value)
                        }
                      />
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`transferable-${tier.id}`}
                        checked={tier.transferable}
                        onChange={(e) =>
                          updateTier(tier.id, "transferable", e.target.checked)
                        }
                        className="rounded border-gray-300 text-stellar-600 focus:ring-stellar-500"
                      />
                      <label
                        htmlFor={`transferable-${tier.id}`}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Allow ticket transfers
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                POAP Settings
              </h2>
              <p className="text-sm text-gray-500">
                Configure Proof of Attendance Protocol badges
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Enable POAP
                    </h3>
                    <p className="text-sm text-gray-500">
                      Mint NFT badges for attendees
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateField("poap", {
                        ...formData.poap,
                        enabled: !formData.poap?.enabled,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      formData.poap?.enabled
                        ? "bg-stellar-600"
                        : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                        formData.poap?.enabled
                          ? "translate-x-6"
                          : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {formData.poap?.enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-4"
                  >
                    <Input
                      label="Badge Image URL"
                      placeholder="https://example.com/badge.png"
                      value={formData.poap?.badgeUrl || ""}
                      onChange={(e) =>
                        updateField("poap", {
                          ...formData.poap,
                          badgeUrl: e.target.value,
                        })
                      }
                      helperText="Upload your badge image to IPFS or paste a URL"
                      leftIcon={<Upload className="h-4 w-4" />}
                    />

                    <Input
                      label="Claim Deadline (Optional)"
                      type="datetime-local"
                      value={formData.poap?.claimDeadline || ""}
                      onChange={(e) =>
                        updateField("poap", {
                          ...formData.poap,
                          claimDeadline: e.target.value,
                        })
                      }
                      helperText="After this date, attendees can no longer claim their POAP"
                      leftIcon={<Calendar className="h-4 w-4" />}
                    />
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                Review & Create
              </h2>
              <p className="text-sm text-gray-500">
                Double-check your event details
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Event Details
                  </h3>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formData.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.description}
                    </p>
                    {formData.date && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        {new Date(formData.date).toLocaleString()}
                      </p>
                    )}
                    {formData.venue && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        {formData.venue}
                        {formData.location && `, ${formData.location}`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    Ticket Tiers ({tiers.length})
                  </h3>
                  <div className="space-y-3">
                    {tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {tier.name || "Unnamed Tier"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tier.supply} tickets available
                            {tier.transferable && " · Transferable"}
                          </p>
                        </div>
                        <Badge variant="default">
                          {tier.price} XLM
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {formData.poap?.enabled && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      POAP Configuration
                    </h3>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-stellar-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        POAP badges will be available for attendees
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isActive && "text-stellar-600 dark:text-stellar-400",
                    isCompleted && "text-success-600 dark:text-success-400",
                    !isActive && !isCompleted && "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                      isActive &&
                        "border-stellar-600 bg-stellar-50 dark:bg-stellar-950",
                      isCompleted &&
                        "border-success-600 bg-success-50 dark:bg-success-950",
                      !isActive &&
                        !isCompleted &&
                        "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      isCompleted
                        ? "bg-success-300 dark:bg-success-700"
                        : "bg-gray-200 dark:bg-gray-700"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="flex gap-3">
          {currentStep < 5 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              Create Event
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
