import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getChallenge, verifyAndIssueToken, getCurrentUser } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { ValidationError } from '../middleware/error-handler';

const challengeSchema = z.object({
  account: z.string().length(56).startsWith('G'),
});

const tokenSchema = z.object({
  transaction: z.string().min(1),
});

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/auth/challenge
   * Build a SEP-10 challenge transaction for the given Stellar account.
   */
  fastify.post('/api/v1/auth/challenge', {
    schema: {
      body: {
        type: 'object',
        required: ['account'],
        properties: {
          account: { type: 'string', minLength: 56, maxLength: 56 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                transaction: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = challengeSchema.parse(request.body);
    const result = await getChallenge(body.account);

    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  /**
   * POST /api/v1/auth/token
   * Verify a signed SEP-10 challenge and issue a JWT.
   */
  fastify.post('/api/v1/auth/token', {
    schema: {
      body: {
        type: 'object',
        required: ['transaction'],
        properties: {
          transaction: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = tokenSchema.parse(request.body);
    const result = await verifyAndIssueToken(fastify, body.transaction);

    return reply.status(200).send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/v1/auth/me
   * Return the current authenticated user's profile.
   */
  fastify.get('/api/v1/auth/me', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new ValidationError('Authentication required');
    }

    const user = await getCurrentUser(request.user.sub);

    return reply.status(200).send({
      success: true,
      data: user,
    });
  });
}
