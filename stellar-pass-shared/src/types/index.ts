// ============================================================
// Stellar Pass — Shared TypeScript Types
// Matches the PostgreSQL schema from the technical architecture
// ============================================================

// --- Enums ---

export type EventStatus = 'draft' | 'on_sale' | 'sold_out' | 'cancelled' | 'past';
export type TicketStatus = 'active' | 'used' | 'frozen' | 'clawed_back';
export type PurchaseSessionStatus = 'pending' | 'confirmed' | 'expired' | 'failed';
export type Currency = 'USDC' | 'XLM' | 'EURC';
export type OrganizerRole = 'organizer' | 'attendee';

export type WebhookEventType =
  | 'ticket.purchased'
  | 'ticket.checked_in'
  | 'ticket.frozen'
  | 'ticket.clawed_back'
  | 'poap.minted'
  | 'event.sold_out';

// --- Core Entities ---

export interface Organizer {
  id: string; // UUID
  stellar_account: string; // G-address (56 chars)
  name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string; // ISO 8601
}

export interface Event {
  id: string; // UUID
  organizer_id: string;
  slug: string;
  name: string;
  description: string | null;
  date_start: string; // ISO 8601
  date_end: string; // ISO 8601
  venue_name: string | null;
  venue_address: string | null;
  venue_lat: number | null;
  venue_lng: number | null;
  image_url: string | null;
  status: EventStatus;
  poap_enabled: boolean;
  poap_badge_url: string | null;
  poap_contract_id: string | null; // Soroban contract ID
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketTier {
  id: string; // UUID
  event_id: string;
  name: string;
  description: string | null;
  price: number; // decimal
  currency: Currency;
  supply: number;
  minted: number;
  transferable: boolean;
  resale_price_cap: number | null;
  nft_contract_id: string | null; // Soroban contract ID
  created_at: string;
}

export interface Ticket {
  id: string; // UUID
  tier_id: string;
  event_id: string;
  owner_wallet: string; // G-address
  nft_asset_code: string; // e.g. SPAS_EVT_ABC_GA_001
  nft_asset_issuer: string | null; // G-address
  status: TicketStatus;
  purchase_tx_hash: string | null;
  purchase_price: number | null;
  purchase_currency: Currency | null;
  checked_in_at: string | null;
  checked_in_by: string | null; // Organizer wallet that scanned
  qr_secret: string; // Ed25519 private key for signing QR
  created_at: string;
}

export interface PurchaseSession {
  id: string; // UUID
  event_id: string;
  tier_id: string;
  buyer_wallet: string; // G-address
  muxed_account: string; // M-address (69 chars)
  muxed_id: number; // 64-bit
  amount: number;
  asset: string; // e.g. "USDC:GBDX..."
  status: PurchaseSessionStatus;
  payment_tx_hash: string | null;
  expires_at: string; // ISO 8601
  confirmed_at: string | null;
  created_at: string;
}

export interface POAPBadge {
  id: string; // UUID
  event_id: string;
  ticket_id: string;
  attendee_wallet: string; // G-address
  nft_asset_code: string;
  mint_tx_hash: string | null;
  metadata_uri: string | null; // IPFS or Arweave URI
  minted_at: string;
}

export interface Webhook {
  id: string; // UUID
  organizer_id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  active: boolean;
  created_at: string;
}

export interface WebhookDelivery {
  id: string; // UUID
  webhook_id: string;
  event_type: WebhookEventType;
  payload: Record<string, unknown>;
  response_code: number | null;
  response_body: string | null;
  delivered_at: string;
  success: boolean | null;
}

// --- Update Types ---

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  status?: EventStatus;
  image_url?: string;
}

export interface UpdateOrganizerRequest {
  name?: string;
  email?: string;
  avatar_url?: string;
}

export interface OrganizerProfile extends Organizer {
  total_events: number;
  total_tickets_sold: number;
  total_revenue: Record<Currency, number>;
}

export interface PayoutInfo {
  organizer_id: string;
  stellar_account: string;
  total_revenue: Record<Currency, number>;
  pending_payouts: number;
  last_payout_at: string | null;
}

export interface CheckInStatus {
  event_id: string;
  event_name: string;
  total_tickets: number;
  pending: number;
  checked_in: number;
  frozen: number;
  clawed_back: number;
  check_in_rate: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    redis: 'ok' | 'error';
  };
}

// --- API Request/Response Types ---

export interface CreateEventRequest {
  name: string;
  description?: string;
  date_start: string;
  date_end: string;
  venue?: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  ticket_tiers: {
    name: string;
    description?: string;
    price: number;
    currency: Currency;
    supply: number;
    transferable?: boolean;
    resale_price_cap?: number;
  }[];
  poap_enabled?: boolean;
  poap_badge_url?: string;
  webhook_url?: string;
}

export interface CreateEventResponse {
  event_id: string;
  slug: string;
}

export interface PurchaseTicketRequest {
  event_id: string;
  tier_id: string;
  buyer_wallet: string;
  payment_asset: Currency;
}

export interface PurchaseTicketResponse {
  session_id: string;
  muxed_account: string;
  amount: string;
  asset: string;
  expires_at: string;
}

export interface CheckInVerifyRequest {
  qr_payload: string;
  organizer_wallet: string;
}

export interface CheckInVerifyResponse {
  valid: boolean;
  ticket_id: string;
  attendee: string;
  tier: string;
  already_checked_in: boolean;
  poap_minted: boolean;
  poap_tx_hash: string | null;
}

export interface AuthChallengeRequest {
  account: string; // G-address
}

export interface AuthChallengeResponse {
  transaction: string; // base64 XDR
}

export interface AuthTokenRequest {
  transaction: string; // signed base64 XDR
}

export interface AuthTokenResponse {
  token: string; // JWT
  account: string; // G-address
}

export interface AnalyticsResponse {
  tickets_sold: number;
  tickets_total: number;
  revenue: Record<Currency, number>;
  check_in_rate: number;
  poap_claim_rate: number;
  top_referrers: { source: string; count: number }[];
  geographic_distribution: Record<string, number>;
  sales_over_time: { date: string; count: number }[];
  check_ins_over_time: { hour: string; count: number }[];
}

// --- Stellar-specific types (from smart contracts) ---

export interface TicketMetadata {
  event_id: Buffer;
  tier: string;
  event_date: number; // Unix timestamp
  venue: string;
  image_url: string;
  is_transferable: boolean;
  resale_price_cap: number | null; // in stroops
  status: TicketStatus;
}

export interface POAPMetadata {
  event_id: Buffer;
  event_name: string;
  event_date: number;
  attendee: string; // G-address
  badge_image_url: string;
  minted_at: number;
}

export interface EscrowListing {
  listing_id: number;
  seller: string; // G-address
  ticket_contract: string; // Soroban contract address
  ticket_id: number;
  ask_price: number; // in stroops
  currency: string; // Soroban contract address
  royalty_bps: number;
  price_cap: number;
  status: 'active' | 'sold' | 'cancelled';
}

// --- QR Code payload ---

export interface QRPayload {
  ticket_id: string;
  event_id: string;
  owner: string; // G-address
  tier: string;
  issued_at: number; // Unix timestamp
  expires_at: number; // Unix timestamp (15 min TTL)
  nonce: string; // random UUID
}

// --- Webhook HTTP payload (sent to organizer's URL) ---

export interface WebhookPayload {
  event: WebhookEventType;
  data: Record<string, unknown>;
  timestamp: string; // ISO 8601
}
