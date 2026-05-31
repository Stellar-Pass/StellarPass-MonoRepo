import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  verifyAndCheckIn,
  batchCheckIn,
  getCheckInStatus,
  verifyCheckInSchema,
  batchCheckInSchema,
} from '../services/checkin.service';
import { authenticate } from '../middleware/auth';
import { ValidationError } from '../middleware/error-handler';

export default async function checkInRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/check-in/verify
   * Verify QR signature and check in a ticket.
   */
  fastify.post('/api/v1/check-in/verify', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const body = verifyCheckInSchema.parse({
      ...request.body,
      organizer_wallet: request.user.sub,
    });

    const result = await verifyAndCheckIn(body);

    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  /**
   * POST /api/v1/check-in/batch
   * Bulk check-in for multiple tickets.
   */
  fastify.post('/api/v1/check-in/batch', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const body = request.body as { items: { qr_payload: string }[] };
    const validated = batchCheckInSchema.parse({
      items: body.items,
      organizer_wallet: request.user.sub,
    });

    const result = await batchCheckIn(validated);

    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/v1/check-in/status
   * Get check-in statistics for an event.
   */
  fastify.get('/api/v1/check-in/status', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const query = request.query as { event_id?: string };
    if (!query.event_id) {
      throw new ValidationError('event_id query parameter is required');
    }

    const status = await getCheckInStatus(query.event_id, request.user.sub);

    return reply.status(200).send({
      success: true,
      data: status,
    });
  });
}
