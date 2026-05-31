import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createWebhook,
  listWebhooks,
  deleteWebhook,
  createWebhookSchema,
} from '../services/webhook.service';
import { authenticate } from '../middleware/auth';
import { ValidationError } from '../middleware/error-handler';

export default async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/webhooks
   * Create a new webhook for the authenticated organizer.
   */
  fastify.post('/api/v1/webhooks', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const body = createWebhookSchema.parse(request.body);
    const result = await createWebhook(request.user.sub, body);

    return reply.status(201).send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/v1/webhooks
   * List all webhooks for the authenticated organizer.
   */
  fastify.get('/api/v1/webhooks', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const webhooks = await listWebhooks(request.user.sub);

    return reply.status(200).send({
      success: true,
      data: webhooks,
    });
  });

  /**
   * DELETE /api/v1/webhooks/:id
   * Delete a webhook (only by its owner).
   */
  fastify.delete('/api/v1/webhooks/:id', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const { id } = request.params as { id: string };
    await deleteWebhook(id, request.user.sub);

    return reply.status(200).send({
      success: true,
      data: { deleted: true },
    });
  });
}
