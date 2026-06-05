import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    requestId: string;
  }
}

/**
 * Plugin that assigns a unique request ID to every incoming request.
 *
 * - Reads `X-Request-Id` from the incoming header (if present) to support
 *   distributed tracing across services.
 * - Otherwise generates a UUID v4.
 * - Sets `requestId` on the FastifyRequest for use in logging.
 * - Returns `X-Request-Id` on every response.
 */
export async function requestIdPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    const headerId = request.headers['x-request-id'];
    request.requestId =
      (Array.isArray(headerId) ? headerId[0] : headerId) || randomUUID();
  });

  fastify.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.header('X-Request-Id', request.requestId);
  });
}
