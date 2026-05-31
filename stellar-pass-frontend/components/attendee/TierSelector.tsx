"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Users,
  ArrowRight,
  Star,
  Zap,
  Crown,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { cn, formatCurrency } from "@/lib/utils";

interface TicketTier {
  id: string;
  name: string;
  price: string;
  supply: number;
  sold: number;
  description?: string;
  features?: string[];
  transferable: boolean;
  saleEndDate?: string;
}

interface TierSelectorProps {
  tiers: TicketTier[];
  selectedTier: string | null;
  onSelect: (tierId: string) => void;
  onPurchase: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const tierIcons: Record<string, React.ElementType> = {
  general: Users,
  ga: Users,
  vip: Star,
  early: Zap,
  premium: Crown,
  platinum: Crown,
  default: Shield,
};

function getTierIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(tierIcons)) {
    if (lower.includes(key)) return Icon;
  }
  return tierIcons.default;
}

function getTierColor(index: number): {
  bg: string;
  border: string;
  text: string;
  icon: string;
} {
  const colors = [
    {
      bg: "bg-stellar-50 dark:bg-stellar-950/30",
      border: "border-stellar-200 dark:border-stellar-800",
      text: "text-stellar-700 dark:text-stellar-300",
      icon: "text-stellar-500",
    },
    {
      bg: "bg-accent-50 dark:bg-accent-950/30",
      border: "border-accent-200 dark:border-accent-800",
      text: "text-accent-700 dark:text-accent-300",
      icon: "text-accent-500",
    },
    {
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      border: "border-yellow-200 dark:border-yellow-800",
      text: "text-yellow-700 dark:text-yellow-300",
      icon: "text-yellow-500",
    },
  ];
  return colors[index % colors.length];
}

export function TierSelector({
  tiers,
  selectedTier,
  onSelect,
  onPurchase,
  loading = false,
  disabled = false,
}: TierSelectorProps) {
  const selected = tiers.find((t) => t.id === selectedTier);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
          Select Your Ticket
        </h2>
        <p className="text-sm text-gray-500">
          Choose a tier to continue with your purchase
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid gap-4">
        {tiers.map((tier, index) => {
          const color = getTierColor(index);
          const Icon = getTierIcon(tier.name);
          const isSoldOut = tier.sold >= tier.supply;
          const isSelected = selectedTier === tier.id;
          const available = tier.supply - tier.sold;

          return (
            <motion.div
              key={tier.id}
              whileHover={!isSoldOut && !disabled ? { scale: 1.01 } : undefined}
              whileTap={!isSoldOut && !disabled ? { scale: 0.99 } : undefined}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  isSelected
                    ? "ring-2 ring-stellar-500 shadow-lg"
                    : "hover:shadow-md",
                  isSoldOut && "opacity-60 cursor-not-allowed",
                  disabled && "pointer-events-none opacity-50"
                )}
                onClick={() => !isSoldOut && onSelect(tier.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        color.bg
                      )}
                    >
                      <Icon className={cn("h-6 w-6", color.icon)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {tier.name}
                        </h3>
                        {index === 0 && (
                          <Badge variant="default" className="text-[10px]">
                            Popular
                          </Badge>
                        )}
                        {isSoldOut && <Badge variant="danger">Sold Out</Badge>}
                      </div>

                      {tier.description && (
                        <p className="text-sm text-gray-500 mb-3">
                          {tier.description}
                        </p>
                      )}

                      {/* Features */}
                      {tier.features && tier.features.length > 0 && (
                        <ul className="space-y-1.5 mb-3">
                          {tier.features.map((feature, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                            >
                              <Check className="h-4 w-4 text-success-500 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Availability */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              available < 10
                                ? "bg-danger-500"
                                : available < 50
                                ? "bg-yellow-500"
                                : "bg-stellar-500"
                            )}
                            style={{
                              width: `${(tier.sold / tier.supply) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {available} left
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(tier.price)}
                      </p>
                      {tier.transferable && (
                        <p className="text-xs text-gray-400 mt-1">
                          Transferable
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Purchase Button */}
      <AnimatePresence>
        {selectedTier && selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="sticky bottom-4"
          >
            <Card className="shadow-xl border-stellar-200 dark:border-stellar-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Selected</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selected.name}
                    </p>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(selected.price)}
                    </p>
                  </div>
                  <Button
                    onClick={onPurchase}
                    loading={loading}
                    disabled={disabled}
                    size="lg"
                  >
                    Get Ticket
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
