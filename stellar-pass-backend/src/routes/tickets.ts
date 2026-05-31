import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createPurchaseSession,
  getTicketById,
  getMyTickets,
  purchaseTicketSchema,
} from '../services/ticket.service';
import { authenticate } from '../middleware/auth';
import { ValidationError } from '../middleware/error-handler';

export default async function ticketRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/tickets/purchase
   * Create a purchase session with muxed account.
   */
  fastify.post('/api/v1/tickets/purchase', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const body = purchaseTicketSchema.parse(request.body);
    const result = await createPurchaseSession(body);

    return reply.status(201).send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/v1/tickets/my
   * Get authenticated user's tickets.
   */
  fastify.get('/api/v1/tickets/my', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const tickets = await getMyTickets(request.user.sub);

    return reply.status(200).send({
      success: true,
      data: tickets,
    });
  });

  /**
   * GET /api/v1/tickets/:id
   * Get ticket detail with QR payload.
   */
  fastify.get('/api/v1/tickets/:id', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const { id } = request.params as { id: string };
    const ticket = await getTicketById(id);

    return reply.status(200).send({
      success: true,
      data: ticket,
    });
  });
}
