import { z } from 'zod';

// ============================================================
// Stellar Pass — Zod Validation Schemas
// ============================================================

// --- Helpers ---
const stellarAddress = z.string().regex(/^G[A-Z2-7]{55}$/, 'Invalid Stellar address');
const muxedAddress = z.string().regex(/^M[A-Z2-7]{68}$/, 'Invalid muxed address');
const uuid = z.string().uuid();
const isoDate = z.string().datetime();

// --- Auth ---
export const authChallengeSchema = z.object({
  account: stellarAddress,
});

export const authTokenSchema = z.object({
  transaction: z.string().min(1),
});

// --- Events ---
export const ticketTierInputSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  currency: z.enum(['USDC', 'XLM', 'EURC']).default('USDC'),
  supply: z.number().int().min(1).max(100_000),
  transferable: z.boolean().default(true),
  resale_price_cap: z.number().min(0).nullable().optional(),
});

export const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  date_start: isoDate,
  date_end: isoDate,
  venue: z.object({
    name: z.string().max(200),
    address: z.string().max(500),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }).optional(),
  ticket_tiers: z.array(ticketTierInputSchema).min(1).max(10),
  poap_enabled: z.boolean().default(false),
  poap_badge_url: z.string().url().optional(),
  webhook_url: z.string().url().optional(),
}).refine(
  (data) => new Date(data.date_end) > new Date(data.date_start),
  { message: 'date_end must be after date_start', path: ['date_end'] }
);

export const updateEventSchema = z.object({
  status: z.enum(['draft', 'on_sale', 'sold_out', 'cancelled', 'past']).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  image_url: z.string().url().optional(),
});

// --- Organizer ---
export const updateOrganizerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
});

// --- Tickets ---
export const purchaseTicketSchema = z.object({
  event_id: uuid,
  tier_id: uuid,
  buyer_wallet: stellarAddress,
  payment_asset: z.enum(['USDC', 'XLM', 'EURC']),
});

// --- Check-in ---
export const checkInVerifySchema = z.object({
  qr_payload: z.string().min(1),
  organizer_wallet: stellarAddress,
});

export const checkInBatchSchema = z.object({
  ticket_ids: z.array(uuid).min(1).max(100),
});

// --- POAP ---
export const claimPOAPSchema = z.object({
  ticket_id: uuid,
  attendee_wallet: stellarAddress,
});

// --- Webhooks ---
export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'ticket.purchased',
    'ticket.checked_in',
    'ticket.frozen',
    'ticket.clawed_back',
    'poap.minted',
    'event.sold_out',
  ])).min(1),
});

// --- Query Params ---
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const eventQuerySchema = paginationSchema.extend({
  status: z.enum(['draft', 'on_sale', 'sold_out', 'cancelled', 'past']).optional(),
  organizer_id: uuid.optional(),
});

export const ticketQuerySchema = paginationSchema.extend({
  event_id: uuid.optional(),
  status: z.enum(['active', 'used', 'frozen', 'clawed_back']).optional(),
  owner_wallet: stellarAddress.optional(),
});

export const analyticsQuerySchema = z.object({
  event_id: uuid,
  date_from: isoDate.optional(),
  date_to: isoDate.optional(),
});
