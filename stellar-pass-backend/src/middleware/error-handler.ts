import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function registerErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler((error, request: FastifyRequest, reply: FastifyReply) => {
    request.log.error(error);

    if (error instanceof AppError) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
          ...(error.details !== undefined && { details: error.details }),
        },
      };
      return reply.status(error.statusCode).send(response);
    }

    if (error.validation) {
      const response: ErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.validation,
        },
      };
      return reply.status(400).send(response);
    }

    // Unknown error
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error.message,
      },
    };
    return reply.status(500).send(response);
  });
}
