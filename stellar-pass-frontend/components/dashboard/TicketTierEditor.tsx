"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  Users,
  DollarSign,
  ArrowUpDown,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn, formatCurrency } from "@/lib/utils";

interface TicketTierData {
  id: string;
  name: string;
  price: string;
  supply: number;
  sold: number;
  description: string;
  transferable: boolean;
  maxPerWallet: number;
  saleStartDate: string;
  saleEndDate: string;
}

interface TicketTierEditorProps {
  tiers: TicketTierData[];
  onUpdate: (tiers: TicketTierData[]) => void;
  eventId: string;
  readOnly?: boolean;
}

const DEFAULT_TIER: Omit<TicketTierData, "id"> = {
  name: "",
  price: "0",
  supply: 100,
  sold: 0,
  description: "",
  transferable: true,
  maxPerWallet: 5,
  saleStartDate: "",
  saleEndDate: "",
};

export function TicketTierEditor({
  tiers,
  onUpdate,
  eventId,
  readOnly = false,
}: TicketTierEditorProps) {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  const addTier = useCallback(() => {
    const newTier: TicketTierData = {
      ...DEFAULT_TIER,
      id: crypto.randomUUID(),
    };
    onUpdate([...tiers, newTier]);
    setExpandedTier(newTier.id);
  }, [tiers, onUpdate]);

  const removeTier = useCallback(
    (id: string) => {
      onUpdate(tiers.filter((t) => t.id !== id));
      if (expandedTier === id) setExpandedTier(null);
    },
    [tiers, onUpdate, expandedTier]
  );

  const updateTier = useCallback(
    (id: string, field: keyof TicketTierData, value: string | number | boolean) => {
      onUpdate(
        tiers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
      );
    },
    [tiers, onUpdate]
  );

  const totalSupply = tiers.reduce((sum, t) => sum + t.supply, 0);
  const totalSold = tiers.reduce((sum, t) => sum + t.sold, 0);
  const totalRevenue = tiers.reduce(
    (sum, t) => sum + parseFloat(t.price) * t.sold,
    0
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stellar-50 dark:bg-stellar-950">
              <Users className="h-5 w-5 text-stellar-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalSold}/{totalSupply}
              </p>
              <p className="text-xs text-gray-500">Tickets Sold</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-50 dark:bg-success-950">
              <DollarSign className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-950">
              <ArrowUpDown className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tiers.length}
              </p>
              <p className="text-xs text-gray-500">Ticket Tiers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tier List */}
      <div className="space-y-3">
        <AnimatePresence>
          {tiers.map((tier, index) => {
            const isExpanded = expandedTier === tier.id;
            const soldPercentage =
              tier.supply > 0 ? (tier.sold / tier.supply) * 100 : 0;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                layout
              >
                <Card
                  className={cn(
                    "transition-all",
                    isExpanded && "ring-2 ring-stellar-500/30"
                  )}
                >
                  {/* Tier Header */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() =>
                      setExpandedTier(isExpanded ? null : tier.id)
                    }
                  >
                    {!readOnly && (
                      <GripVertical className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {tier.name || "Unnamed Tier"}
                        </h3>
                        {tier.sold === tier.supply && (
                          <Badge variant="danger">Sold Out</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(tier.price)} · {tier.sold}/{tier.supply}{" "}
                        sold
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              soldPercentage >= 90
                                ? "bg-danger-500"
                                : soldPercentage >= 50
                                ? "bg-yellow-500"
                                : "bg-stellar-500"
                            )}
                            style={{ width: `${soldPercentage}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 text-right">
                          {Math.round(soldPercentage)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Tier Editor */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Tier Name"
                              value={tier.name}
                              onChange={(e) =>
                                updateTier(tier.id, "name", e.target.value)
                              }
                              placeholder="e.g., VIP"
                              disabled={readOnly}
                            />
                            <Input
                              label="Price (XLM)"
                              type="number"
                              value={tier.price}
                              onChange={(e) =>
                                updateTier(tier.id, "price", e.target.value)
                              }
                              placeholder="10"
                              disabled={readOnly}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Total Supply"
                              type="number"
                              value={tier.supply.toString()}
                              onChange={(e) =>
                                updateTier(
                                  tier.id,
                                  "supply",
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={readOnly}
                            />
                            <Input
                              label="Max Per Wallet"
                              type="number"
                              value={tier.maxPerWallet.toString()}
                              onChange={(e) =>
                                updateTier(
                                  tier.id,
                                  "maxPerWallet",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              disabled={readOnly}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                              Description
                            </label>
                            <textarea
                              className="flex min-h-[60px] w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-stellar-500"
                              value={tier.description}
                              onChange={(e) =>
                                updateTier(
                                  tier.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="What's included in this tier?"
                              disabled={readOnly}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Sale Start"
                              type="datetime-local"
                              value={tier.saleStartDate}
                              onChange={(e) =>
                                updateTier(
                                  tier.id,
                                  "saleStartDate",
                                  e.target.value
                                )
                              }
                              disabled={readOnly}
                            />
                            <Input
                              label="Sale End"
                              type="datetime-local"
                              value={tier.saleEndDate}
                              onChange={(e) =>
                                updateTier(
                                  tier.id,
                                  "saleEndDate",
                                  e.target.value
                                )
                              }
                              disabled={readOnly}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={tier.transferable}
                                  onChange={(e) =>
                                    updateTier(
                                      tier.id,
                                      "transferable",
                                      e.target.checked
                                    )
                                  }
                                  disabled={readOnly}
                                  className="rounded border-gray-300 text-stellar-600 focus:ring-stellar-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  Transferable
                                </span>
                              </label>
                            </div>

                            {!readOnly && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => removeTier(tier.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove Tier
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add Tier Button */}
      {!readOnly && (
        <Button variant="outline" onClick={addTier} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Ticket Tier
        </Button>
      )}
    </div>
  );
}
