/**
 * Shared Service Types
 *
 * Cross-domain types used across multiple service areas including:
 * - Pagination
 * - Common utilities
 */

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  limit?: number;
  cursor?: string;
}
