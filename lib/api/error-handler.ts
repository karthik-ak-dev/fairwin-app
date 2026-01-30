/**
 * API Error Handler
 *
 * Maps service layer errors to HTTP responses with appropriate status codes.
 * Provides consistent error response format across all API routes.
 */

import { NextResponse } from 'next/server';
import { ServiceError } from '@/lib/services/errors';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
}

/**
 * Map ServiceError to HTTP status code
 */
function getStatusCode(error: ServiceError): number {
  const statusMap: Record<string, number> = {
    // 400 Bad Request
    INVALID_RAFFLE_CONFIG: 400,
    INVALID_ENTRY: 400,
    INVALID_STATUS_TRANSITION: 400,
    VALIDATION_ERROR: 400,
    MAX_ENTRIES_EXCEEDED: 400,
    PAYOUT_ALREADY_PROCESSED: 400,

    // 404 Not Found
    RAFFLE_NOT_FOUND: 404,
    ENTRY_NOT_FOUND: 404,
    WINNER_NOT_FOUND: 404,
    USER_NOT_FOUND: 404,
    PAYOUT_NOT_FOUND: 404,

    // 409 Conflict
    RAFFLE_NOT_ACTIVE: 409,
    RAFFLE_NOT_DRAWABLE: 409,
    RAFFLE_ALREADY_DRAWN: 409,

    // 422 Unprocessable Entity
    NO_ENTRIES_FOR_DRAW: 422,
    PAYOUT_FAILED: 422,
    CONTRACT_WRITE_ERROR: 422,
    INSUFFICIENT_FUNDS: 422,
  };

  return statusMap[error.code] || 500;
}

/**
 * Handle service layer errors and return appropriate HTTP response
 */
export function handleError(error: unknown): NextResponse<ErrorResponse> {
  console.error('[API Error]', error);

  // Handle ServiceError
  if (error instanceof ServiceError) {
    const statusCode = getStatusCode(error);

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: statusCode }
    );
  }

  // Handle generic errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
    },
    { status: 500 }
  );
}

/**
 * Convenience error responses
 */
export function badRequest(message: string, field?: string): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code: 'BAD_REQUEST',
        message,
        field,
      },
    },
    { status: 400 }
  );
}

export function unauthorized(message = 'Unauthorized'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
    },
    { status: 401 }
  );
}

export function forbidden(message = 'Forbidden'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code: 'FORBIDDEN',
        message,
      },
    },
    { status: 403 }
  );
}

export function notFound(message = 'Not found'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code: 'NOT_FOUND',
        message,
      },
    },
    { status: 404 }
  );
}

export function serverError(message = 'Internal server error'): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message,
      },
    },
    { status: 500 }
  );
}
