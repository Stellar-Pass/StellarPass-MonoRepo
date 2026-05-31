import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pool from '../db/pool';
import { authenticate } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/error-handler';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  avatar_url: z.string().url().optional(),
});

export default async function organizerRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/organizer/me
   * Get the authenticated organizer's profile.
   */
  fastify.get('/api/v1/organizer/me', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const result = await pool.query(
      `SELECT id, stellar_account, name, email, avatar_url, created_at
       FROM organizers
       WHERE stellar_account = $1`,
      [request.user.sub],
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Organizer not found');
    }

    return reply.status(200).send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * PATCH /api/v1/organizer/me
   * Update the authenticated organizer's profile.
   */
  fastify.patch('/api/v1/organizer/me', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const body = updateProfileSchema.parse(request.body);

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }
    if (body.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(body.email);
    }
    if (body.avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(body.avatar_url);
    }

    if (updates.length === 0) {
      throw new ValidationError('No fields to update');
    }

    values.push(request.user.sub);

    const result = await pool.query(
      `UPDATE organizers SET ${updates.join(', ')} WHERE stellar_account = $${paramIndex}
       RETURNING id, stellar_account, name, email, avatar_url, created_at`,
      values,
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Organizer not found');
    }

    return reply.status(200).send({
      success: true,
      data: result.rows[0],
    });
  });

  /**
   * GET /api/v1/organizer/payouts
   * Get payout history for the authenticated organizer.
   */
  fastify.get('/api/v1/organizer/payouts', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    // Get total revenue per event for the organizer
    const result = await pool.query(
      `SELECT
         e.id as event_id,
         e.name as event_name,
         e.slug as event_slug,
         e.status as event_status,
         COUNT(t.id) as tickets_sold,
         COALESCE(SUM(t.purchase_price), 0) as total_revenue,
         COALESCE(t.purchase_currency, 'USDC') as currency
       FROM events e
       JOIN organizers o ON o.id = e.organizer_id
       LEFT JOIN tickets t ON t.event_id = e.id AND t.status IN ('active', 'used')
       WHERE o.stellar_account = $1
       GROUP BY e.id, e.name, e.slug, e.status, t.purchase_currency
       ORDER BY e.created_at DESC`,
      [request.user.sub],
    );

    return reply.status(200).send({
      success: true,
      data: result.rows,
    });
  });
}
