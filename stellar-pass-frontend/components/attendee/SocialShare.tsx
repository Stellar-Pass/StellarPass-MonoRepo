"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Share2,
  Twitter,
  Link2,
  Check,
  MessageSquare,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { APP_URL } from "@/lib/constants";

interface SocialShareProps {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  hashtags?: string[];
  compact?: boolean;
}

export function SocialShare({
  title,
  description,
  url,
  imageUrl,
  hashtags = [],
  compact = false,
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || APP_URL;
  const shareText = description || title;
  const hashtagString = hashtags.length > 0 ? hashtags.map((t) => `#${t}`).join(" ") : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitter = () => {
    const twitterUrl = new URL("https://twitter.com/intent/tweet");
    twitterUrl.searchParams.set("text", `${shareText} ${hashtagString}`);
    twitterUrl.searchParams.set("url", shareUrl);
    window.open(twitterUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const handleFarcaster = () => {
    const farcasterUrl = new URL("https://warpcast.com/~/compose");
    farcasterUrl.searchParams.set("text", `${shareText}\n\n${shareUrl}`);
    if (hashtags.length > 0) {
      farcasterUrl.searchParams.set("embeds[]", shareUrl);
    }
    window.open(farcasterUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleTwitter} title="Share on Twitter">
          <Twitter className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleFarcaster} title="Share on Farcaster">
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy link">
          {copied ? (
            <Check className="h-4 w-4 text-success-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Share
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Twitter */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleTwitter}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-700 dark:hover:bg-blue-950 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Twitter className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Twitter
            </span>
          </motion.button>

          {/* Farcaster */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleFarcaster}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 dark:border-gray-700 dark:hover:border-purple-700 dark:hover:bg-purple-950 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <MessageSquare className="h-5 w-5 text-purple-500" />
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Farcaster
            </span>
          </motion.button>

          {/* Copy Link */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-900 transition-colors"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              {copied ? (
                <Check className="h-5 w-5 text-success-500" />
              ) : (
                <Link2 className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {copied ? "Copied!" : "Copy Link"}
            </span>
          </motion.button>
        </div>

        {/* Native Share (mobile) */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={handleNativeShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share via...
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
