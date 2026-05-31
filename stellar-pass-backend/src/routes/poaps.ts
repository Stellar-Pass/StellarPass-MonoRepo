import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import pool from '../db/pool';
import { authenticate } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/error-handler';

export default async function poapRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/poaps/my
   * Get authenticated user's POAP badges.
   */
  fastify.get('/api/v1/poaps/my', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const result = await pool.query(
      `SELECT pb.id, pb.nft_asset_code, pb.mint_tx_hash, pb.metadata_uri, pb.minted_at,
              e.name as event_name, e.slug as event_slug, e.date_start, e.image_url
       FROM poap_badges pb
       JOIN events e ON e.id = pb.event_id
       WHERE pb.attendee_wallet = $1
       ORDER BY pb.minted_at DESC`,
      [request.user.sub],
    );

    return reply.status(200).send({
      success: true,
      data: result.rows,
    });
  });

  /**
   * GET /api/v1/poaps/:id
   * Get POAP detail with share URL.
   */
  fastify.get('/api/v1/poaps/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const result = await pool.query(
      `SELECT pb.*, e.name as event_name, e.slug as event_slug,
              e.date_start, e.venue_name, e.image_url as event_image,
              o.name as organizer_name
       FROM poap_badges pb
       JOIN events e ON e.id = pb.event_id
       JOIN organizers o ON o.id = e.organizer_id
       WHERE pb.id = $1`,
      [id],
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('POAP badge not found');
    }

    const poap = result.rows[0];
    const baseUrl = process.env.FRONTEND_URL || 'https://stellarpass.io';
    const shareUrl = `${baseUrl}/poap/${poap.id}`;

    return reply.status(200).send({
      success: true,
      data: {
        ...poap,
        share_url: shareUrl,
      },
    });
  });
}
