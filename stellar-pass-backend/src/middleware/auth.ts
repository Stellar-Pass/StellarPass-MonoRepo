import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from './error-handler';

export interface JWTPayload {
  sub: string; // stellar_account (G-address)
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
  }
}

/**
 * PreHandler hook that verifies the JWT and attaches user to request.
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const decoded = await request.jwtVerify<JWTPayload>();
    request.user = decoded;
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

/**
 * PreHandler hook that verifies JWT and checks if user is the organizer
 * of the resource identified by :id param (from the URL).
 */
export async function requireOrganizer(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authenticate(request, reply);
  // Additional organizer checks are done in the service layer
  // where we can query the DB for ownership
}

/**
 * PreHandler hook that verifies JWT for optional auth.
 * Does not throw if token is missing, but will throw if token is invalid.
 */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return; // No token, continue without user
  }
  try {
    const decoded = await request.jwtVerify<JWTPayload>();
    request.user = decoded;
  } catch {
    throw new UnauthorizedError('Invalid token');
  }
}
