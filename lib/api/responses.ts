/**
 * API Response Helpers
 *
 * Standardized response formatters for successful API responses.
 */

import { NextResponse } from 'next/server';

/**
 * Success response with data
 */
export function success<T = any>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Created response (201)
 */
export function created<T = any>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: 201 });
}

/**
 * No content response (204)
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
    total?: number;
  };
}

/**
 * Create paginated response
 */
export function paginated<T>(
  items: T[],
  hasMore: boolean,
  nextCursor?: string,
  total?: number
): NextResponse<PaginatedResponse<T>> {
  return success({
    items,
    pagination: {
      nextCursor,
      hasMore,
      ...(total !== undefined && { total }),
    },
  });
}
