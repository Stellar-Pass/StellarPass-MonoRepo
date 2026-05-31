import pool from '../db/pool';
import redis from '../db/redis';
import { generateSlug } from '../utils/slug';
import { generateKeypair } from '../utils/crypto';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../middleware/error-handler';
import { z } from 'zod';

// -- Zod schemas for validation ---

export const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  date_start: z.string().datetime(),
  date_end: z.string().datetime(),
  venue: z.object({
    name: z.string().max(200),
    address: z.string().max(500),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }).optional(),
  ticket_tiers: z.array(z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    price: z.number().min(0),
    currency: z.enum(['USDC', 'XLM', 'EURC']).default('USDC'),
    supply: z.number().int().min(1).max(100000),
    transferable: z.boolean().default(true),
    resale_price_cap: z.number().positive().optional(),
  })).min(1).max(10),
  poap_enabled: z.boolean().default(false),
  poap_badge_url: z.string().url().optional(),
  webhook_url: z.string().url().optional(),
});

export const updateEventSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['draft', 'on_sale', 'sold_out', 'cancelled', 'past']).optional(),
  image_url: z.string().url().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

/**
 * Create a new event with ticket tiers.
 */
export async function createEvent(
  organizerWallet: string,
  input: CreateEventInput,
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get organizer ID
    const orgResult = await client.query(
      'SELECT id FROM organizers WHERE stellar_account = $1',
      [organizerWallet],
    );
    if (orgResult.rows.length === 0) {
      throw new NotFoundError('Organizer not found');
    }
    const organizerId = orgResult.rows[0].id;

    const slug = generateSlug(input.name);

    // Insert event
    const eventResult = await client.query(
      `INSERT INTO events (
        organizer_id, slug, name, description, date_start, date_end,
        venue_name, venue_address, venue_lat, venue_lng,
        poap_enabled, poap_badge_url, webhook_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft')
      RETURNING id, slug`,
      [
        organizerId,
        slug,
        input.name,
        input.description || null,
        input.date_start,
        input.date_end,
        input.venue?.name || null,
        input.venue?.address || null,
        input.venue?.lat || null,
        input.venue?.lng || null,
        input.poap_enabled,
        input.poap_badge_url || null,
        input.webhook_url || null,
      ],
    );

    const event = eventResult.rows[0];

    // Insert ticket tiers
    for (const tier of input.ticket_tiers) {
      await client.query(
        `INSERT INTO ticket_tiers (event_id, name, description, price, currency, supply, transferable, resale_price_cap)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          event.id,
          tier.name,
          tier.description || null,
          tier.price,
          tier.currency,
          tier.supply,
          tier.transferable,
          tier.resale_price_cap || null,
        ],
      );
    }

    await client.query('COMMIT');

    return { event_id: event.id, slug: event.slug };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * List events with pagination and optional filters.
 */
export async function listEvents(params: {
  page?: number;
  limit?: number;
  status?: string;
  organizer_id?: string;
  search?: string;
}) {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.status) {
    conditions.push(`e.status = $${paramIndex++}`);
    values.push(params.status);
  }
  if (params.organizer_id) {
    conditions.push(`e.organizer_id = $${paramIndex++}`);
    values.push(params.organizer_id);
  }
  if (params.search) {
    conditions.push(`(e.name ILIKE $${paramIndex} OR e.description ILIKE $${paramIndex})`);
    values.push(`%${params.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM events e ${whereClause}`,
    values,
  );

  const dataResult = await pool.query(
    `SELECT e.id, e.slug, e.name, e.description, e.date_start, e.date_end,
            e.venue_name, e.venue_address, e.image_url, e.status,
            e.poap_enabled, e.created_at,
            o.name as organizer_name, o.stellar_account as organizer_wallet,
            (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id AND t.status = 'active') as tickets_sold,
            (SELECT COALESCE(SUM(tt.supply), 0) FROM ticket_tiers tt WHERE tt.event_id = e.id) as total_supply,
            (SELECT COALESCE(MIN(tt.price), 0) FROM ticket_tiers tt WHERE tt.event_id = e.id) as min_price
     FROM events e
     JOIN organizers o ON o.id = e.organizer_id
     ${whereClause}
     ORDER BY e.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset],
  );

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count, 10),
      pages: Math.ceil(parseInt(countResult.rows[0].count, 10) / limit),
    },
  };
}

/**
 * Get a single event with tiers and sales count.
 */
export async function getEventById(eventId: string) {
  const eventResult = await pool.query(
    `SELECT e.*, o.name as organizer_name, o.stellar_account as organizer_wallet
     FROM events e
     JOIN organizers o ON o.id = e.organizer_id
     WHERE e.id = $1`,
    [eventId],
  );

  if (eventResult.rows.length === 0) {
    throw new NotFoundError('Event not found');
  }

  const event = eventResult.rows[0];

  const tiersResult = await pool.query(
    `SELECT tt.*,
            (SELECT COUNT(*) FROM tickets t WHERE t.tier_id = tt.id AND t.status = 'active') as sold
     FROM ticket_tiers tt
     WHERE tt.event_id = $1
     ORDER BY tt.price ASC`,
    [eventId],
  );

  return {
    ...event,
    tiers: tiersResult.rows,
  };
}

/**
 * Update an event (only by its organizer).
 */
export async function updateEvent(
  eventId: string,
  organizerWallet: string,
  input: UpdateEventInput,
) {
  // Verify ownership
  const eventResult = await pool.query(
    `SELECT e.id, e.organizer_id
     FROM events e
     JOIN organizers o ON o.id = e.organizer_id
     WHERE e.id = $1 AND o.stellar_account = $2`,
    [eventId, organizerWallet],
  );

  if (eventResult.rows.length === 0) {
    throw new NotFoundError('Event not found or you are not the organizer');
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    values.push(input.description);
  }
  if (input.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(input.status);
  }
  if (input.image_url !== undefined) {
    updates.push(`image_url = $${paramIndex++}`);
    values.push(input.image_url);
  }

  if (updates.length === 0) {
    throw new ValidationError('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(eventId);

  const result = await pool.query(
    `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );

  return result.rows[0];
}
