/**
 * API Request Helpers
 *
 * Utilities for parsing and handling incoming API requests
 */

/**
 * Parse pagination parameters from URL search params
 *
 * @param searchParams - URLSearchParams from request.nextUrl
 * @param defaultLimit - Default limit if not provided (default: 50)
 * @returns Object with limit and cursor
 */
export function parsePaginationParams(searchParams: URLSearchParams, defaultLimit = 50) {
  return {
    limit: parseInt(searchParams.get('limit') || String(defaultLimit), 10),
    cursor: searchParams.get('cursor') || undefined,
  };
}
