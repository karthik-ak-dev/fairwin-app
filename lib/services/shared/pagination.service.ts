/**
 * Pagination Service
 *
 * Utilities for cursor-based pagination.
 */

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
