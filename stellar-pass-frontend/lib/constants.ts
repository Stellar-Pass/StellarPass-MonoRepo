export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";
export const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";
export const STELLAR_PASS_ISSUER = process.env.NEXT_PUBLIC_STELLAR_PASS_ISSUER || "";

export const IS_TESTNET = STELLAR_NETWORK === "testnet";

export const WALLET_OPTIONS = [
  { id: "freighter", name: "Freighter", icon: "/wallets/freighter.svg" },
  { id: "albedo", name: "Albedo", icon: "/wallets/albedo.svg" },
  { id: "xbull", name: "xBull", icon: "/wallets/xbull.svg" },
  { id: "lobstr", name: "Lobstr", icon: "/wallets/lobstr.svg" },
] as const;

export type WalletType = (typeof WALLET_OPTIONS)[number]["id"];

export const TICKET_STATUS = {
  ACTIVE: "active",
  USED: "used",
  FROZEN: "frozen",
  CLAWED_BACK: "clawed_back",
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

export const EVENT_STATUS = {
  DRAFT: "draft",
  ON_SALE: "on_sale",
  SOLD_OUT: "sold_out",
  CANCELLED: "cancelled",
  PAST: "past",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const PURCHASE_SESSION_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  EXPIRED: "expired",
  FAILED: "failed",
} as const;

export type PurchaseSessionStatus = (typeof PURCHASE_SESSION_STATUS)[keyof typeof PURCHASE_SESSION_STATUS];

export const NAV_LINKS = {
  dashboard: [
    { href: "/dashboard", label: "Overview", icon: "LayoutDashboard" },
    { href: "/dashboard/events", label: "Events", icon: "Calendar" },
    { href: "/dashboard/profile", label: "Profile", icon: "User" },
    { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
  ],
  event: [
    { href: "overview", label: "Overview", icon: "BarChart3" },
    { href: "tickets", label: "Tickets", icon: "Ticket" },
    { href: "check-in", label: "Check-in", icon: "ScanLine" },
    { href: "poap", label: "POAP", icon: "Award" },
    { href: "settings", label: "Settings", icon: "Settings" },
  ],
  public: [
    { href: "/tickets", label: "My Tickets" },
    { href: "/poaps", label: "My POAPs" },
  ],
} as const;
