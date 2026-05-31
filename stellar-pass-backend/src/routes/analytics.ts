import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getEventAnalytics } from '../services/analytics.service';
import { authenticate } from '../middleware/auth';
import { ValidationError } from '../middleware/error-handler';

export default async function analyticsRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/analytics/:event_id
   * Get full analytics for an event.
   */
  fastify.get('/api/v1/analytics/:event_id', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const { event_id } = request.params as { event_id: string };
    const analytics = await getEventAnalytics(event_id, request.user.sub);

    return reply.status(200).send({
      success: true,
      data: analytics,
    });
  });
}
