"use client";

import React, { useState } from "react";
import {
  User,
  Wallet,
  Globe,
  Save,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWallet } from "@/hooks/useWallet";
import { truncateAddress } from "@/lib/utils";
import { HORIZON_URL } from "@/lib/constants";

export default function ProfilePage() {
  const { publicKey, walletType } = useWallet();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    website: "",
    twitter: "",
    bio: "",
  });

  const handleCopy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your organizer profile and Stellar account
        </p>
      </div>

      {/* Wallet Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Stellar Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-stellar">
              <User className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono text-sm text-gray-900 dark:text-white truncate">
                  {publicKey ? truncateAddress(publicKey, 12) : "Not connected"}
                </p>
                <Badge variant="secondary" className="capitalize">
                  {walletType || "Unknown"}
                </Badge>
              </div>
              {publicKey && (
                <p className="text-xs text-gray-500 font-mono truncate">
                  {publicKey}
                </p>
              )}
            </div>
            {publicKey && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" asChild title="View on Explorer">
                  <a
                    href={`${HORIZON_URL}/accounts/${publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
              placeholder="Your name or organization"
              leftIcon={<User className="h-4 w-4" />}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              placeholder="you@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Website"
              value={profile.website}
              onChange={(e) =>
                setProfile({ ...profile, website: e.target.value })
              }
              placeholder="https://yourwebsite.com"
              leftIcon={<Globe className="h-4 w-4" />}
            />
            <Input
              label="Twitter"
              value={profile.twitter}
              onChange={(e) =>
                setProfile({ ...profile, twitter: e.target.value })
              }
              placeholder="@yourhandle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Bio
            </label>
            <textarea
              className="flex min-h-[100px] w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-stellar-500"
              value={profile.bio}
              onChange={(e) =>
                setProfile({ ...profile, bio: e.target.value })
              }
              placeholder="Tell attendees about yourself or your organization..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4 mr-2" />
          Save Profile
        </Button>
      </div>
    </div>
  );
}
