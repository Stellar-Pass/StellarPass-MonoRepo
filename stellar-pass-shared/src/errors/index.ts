// ============================================================
// Stellar Pass — Shared Error Utilities
// ============================================================

/**
 * Standard error codes used across Stellar Pass services.
 */
export const ERROR_CODES = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Business logic errors
  EVENT_NOT_ON_SALE: 'EVENT_NOT_ON_SALE',
  TICKET_SOLD_OUT: 'TICKET_SOLD_OUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TICKET_ALREADY_USED: 'TICKET_ALREADY_USED',
  TICKET_FROZEN: 'TICKET_FROZEN',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',

  // External service errors
  STELLAR_ERROR: 'STELLAR_ERROR',
  HORIZON_ERROR: 'HORIZON_ERROR',
  SOROBAN_ERROR: 'SOROBAN_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  REDIS_ERROR: 'REDIS_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Internal
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Standard error response format.
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/**
 * Standard success response format.
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export type APIResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Create a standard error response.
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown,
  requestId?: string,
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      ...(requestId && { requestId }),
    },
  };
}

/**
 * Create a standard success response.
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Map of error codes to HTTP status codes.
 */
export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  INVALID_TOKEN: 401,
  TOKEN_EXPIRED: 401,
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_FIELD: 400,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  CONFLICT: 409,
  EVENT_NOT_ON_SALE: 400,
  TICKET_SOLD_OUT: 409,
  SESSION_EXPIRED: 410,
  TICKET_ALREADY_USED: 409,
  TICKET_FROZEN: 403,
  INSUFFICIENT_BALANCE: 400,
  STELLAR_ERROR: 502,
  HORIZON_ERROR: 502,
  SOROBAN_ERROR: 502,
  DATABASE_ERROR: 500,
  REDIS_ERROR: 500,
  RATE_LIMIT_EXCEEDED: 429,
  INTERNAL_ERROR: 500,
};

/**
 * Get HTTP status code for an error code.
 */
export function getStatusCode(code: ErrorCode): number {
  return ERROR_STATUS_MAP[code] || 500;
}
