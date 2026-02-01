/**
 * Pagination Service
 *
 * Utilities for cursor-based pagination.
 */

import type { PaginatedResponse } from '../types';
import { pagination } from '@/lib/constants';

/**
 * Encode cursor to base64
 *
 * @param value String value to encode as cursor
 * @returns Base64-encoded cursor
 */
export function encodeCursor(value: string): string {
  return Buffer.from(value).toString('base64');
}

/**
 * Decode cursor from base64
 *
 * @param cursor Base64-encoded cursor
 * @returns Decoded string value
 */
export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf-8');
  } catch (error) {
    return '';
  }
}

/**
 * Build paginated response
 *
 * @param items Array of items
 * @param limit Page limit
 * @param getCursor Function to extract cursor value from item
 * @returns Paginated response with nextCursor and hasMore
 */
export function buildPaginatedResponse<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string
): PaginatedResponse<T> {
  const hasMore = items.length === limit;

  const nextCursor = hasMore ? encodeCursor(getCursor(items[items.length - 1])) : undefined;

  return {
    items,
    nextCursor,
    hasMore,
    total: undefined, // Not calculated for cursor pagination
  };
}

/**
 * Parse pagination parameters from request
 *
 * @param params URL search params or query object
 * @returns Parsed limit and cursor
 */
export function parsePaginationParams(params: URLSearchParams | Record<string, string | undefined>): {
  limit: number;
  cursor?: string;
} {
  let limitStr: string | undefined;
  let cursor: string | undefined;

  if (params instanceof URLSearchParams) {
    limitStr = params.get('limit') || undefined;
    cursor = params.get('cursor') || undefined;
  } else {
    limitStr = params.limit;
    cursor = params.cursor;
  }

  // Parse limit (default: 20, max: 100)
  let limit = pagination.DEFAULT_LIMIT;
  if (limitStr) {
    const parsed = parseInt(limitStr, 10);
    if (!isNaN(parsed) && parsed > 0) {
      limit = Math.min(parsed, 100); // Cap at 100
    }
  }

  return { limit, cursor };
}

/**
 * Create pagination links (for REST APIs)
 *
 * @param baseUrl Base URL for pagination links
 * @param params Current query parameters
 * @param nextCursor Next page cursor
 * @returns Object with next and previous links
 */
export function createPaginationLinks(
  baseUrl: string,
  params: Record<string, string>,
  nextCursor?: string
): {
  next?: string;
  self: string;
} {
  const queryParams = new URLSearchParams(params);

  const selfUrl = `${baseUrl}?${queryParams.toString()}`;

  if (!nextCursor) {
    return { self: selfUrl };
  }

  const nextParams = new URLSearchParams(params);
  nextParams.set('cursor', nextCursor);

  const nextUrl = `${baseUrl}?${nextParams.toString()}`;

  return {
    self: selfUrl,
    next: nextUrl,
  };
}

/**
 * Slice array for pagination
 *
 * Helper to manually paginate an in-memory array
 *
 * @param items Full array of items
 * @param cursor Current cursor (item ID)
 * @param limit Page limit
 * @param getId Function to extract ID from item
 * @returns Sliced array starting after cursor
 */
export function paginateArray<T>(
  items: T[],
  cursor: string | undefined,
  limit: number,
  getId: (item: T) => string
): T[] {
  let startIndex = 0;

  if (cursor) {
    const decodedCursor = decodeCursor(cursor);
    startIndex = items.findIndex((item) => getId(item) === decodedCursor);

    if (startIndex === -1) {
      startIndex = 0;
    } else {
      startIndex += 1; // Start after cursor
    }
  }

  return items.slice(startIndex, startIndex + limit);
}

/**
 * Check if pagination is needed
 *
 * @param totalItems Total number of items
 * @param limit Items per page
 * @returns true if pagination is needed
 */
export function isPaginationNeeded(totalItems: number, limit: number): boolean {
  return totalItems > limit;
}

/**
 * Calculate total pages (for offset pagination)
 *
 * @param totalItems Total number of items
 * @param limit Items per page
 * @returns Total number of pages
 */
export function calculateTotalPages(totalItems: number, limit: number): number {
  return Math.ceil(totalItems / limit);
}
