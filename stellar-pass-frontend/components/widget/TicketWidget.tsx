"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TicketWidgetProps {
  eventId: string;
  tier?: string;
  theme?: "light" | "dark";
  buttonText?: string;
  className?: string;
}

/**
 * Embeddable ticket widget component.
 *
 * This component renders a web component `<stellar-pass-ticket>` that can be
 * embedded on any website. It handles:
 * - Rendering a ticket purchase button/card
 * - Opening a modal checkout flow on click
 * - Wallet connection and payment
 * - Callback events (onSuccess, onError)
 *
 * Usage:
 * ```tsx
 * <TicketWidget
 *   eventId="evt_abc123"
 *   tier="vip"
 *   theme="dark"
 *   buttonText="Get Tickets"
 * />
 * ```
 */
export function TicketWidget({
  eventId,
  tier,
  theme = "light",
  buttonText = "Get Tickets",
  className,
}: TicketWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load widget script if not already loaded
    const scriptId = "stellar-pass-widget-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.stellarpass.io/widget.js";
      script.async = true;
      document.head.appendChild(script);
    }

    // Create the web component
    if (containerRef.current) {
      const widget = document.createElement("stellar-pass-ticket");
      widget.setAttribute("event-id", eventId);
      if (tier) widget.setAttribute("tier", tier);
      widget.setAttribute("theme", theme);
      widget.setAttribute("button-text", buttonText);

      // Event listeners
      widget.addEventListener("onSuccess", ((e: CustomEvent) => {
        console.log("Ticket purchased:", e.detail);
      }) as EventListener);

      widget.addEventListener("onError", ((e: CustomEvent) => {
        console.error("Widget error:", e.detail);
      }) as EventListener);

      // Clear and append
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(widget);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [eventId, tier, theme, buttonText]);

  return (
    <div
      ref={containerRef}
      className={cn("stellar-pass-widget", className)}
      data-event-id={eventId}
      data-tier={tier}
      data-theme={theme}
    >
      {/* Fallback while script loads */}
      <div className="flex items-center justify-center p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stellar-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading ticket widget...</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Server-side rendered version of the widget.
 * Use this when you need SEO-friendly markup.
 */
export function TicketWidgetSSR({
  eventId,
  tier,
  theme = "light",
  buttonText = "Get Tickets",
  className,
}: TicketWidgetProps) {
  return (
    <div className={cn("stellar-pass-widget", className)}>
      <script
        src="https://cdn.stellarpass.io/widget.js"
        async
      />
      <stellar-pass-ticket
        event-id={eventId}
        tier={tier}
        theme={theme}
        button-text={buttonText}
      />
    </div>
  );
}

// Type declaration for the web component
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "stellar-pass-ticket": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "event-id"?: string;
          tier?: string;
          theme?: string;
          "button-text"?: string;
        },
        HTMLElement
      >;
    }
  }
}
