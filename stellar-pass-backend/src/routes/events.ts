import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  createEventSchema,
  updateEventSchema,
} from '../services/event.service';
import { authenticate, optionalAuth } from '../middleware/auth';
import { ValidationError } from '../middleware/error-handler';

export default async function eventRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/events
   * Create a new event with ticket tiers.
   */
  fastify.post('/api/v1/events', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const body = createEventSchema.parse(request.body);
    const result = await createEvent(request.user.sub, body);

    return reply.status(201).send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/v1/events
   * List events with pagination and filters.
   */
  fastify.get('/api/v1/events', {
    preHandler: [optionalAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      page?: string;
      limit?: string;
      status?: string;
      organizer_id?: string;
      search?: string;
    };

    const result = await listEvents({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      status: query.status,
      organizer_id: query.organizer_id,
      search: query.search,
    });

    return reply.status(200).send({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  });

  /**
   * GET /api/v1/events/:id
   * Get event detail with tiers and sales count.
   */
  fastify.get('/api/v1/events/:id', {
    preHandler: [optionalAuth],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const event = await getEventById(id);

    return reply.status(200).send({
      success: true,
      data: event,
    });
  });

  /**
   * PATCH /api/v1/events/:id
   * Update event status or details.
   */
  fastify.patch('/api/v1/events/:id', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const { id } = request.params as { id: string };
    const body = updateEventSchema.parse(request.body);
    const event = await updateEvent(id, request.user.sub, body);

    return reply.status(200).send({
      success: true,
      data: event,
    });
  });
}
