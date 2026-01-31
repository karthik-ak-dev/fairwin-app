import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getPlatformStats } from '@/lib/services/admin/admin-stats.service';

/**
 * GET /api/admin/stats
 *
 * Get platform statistics (admin only)
 *
 * Requires: Authorization header with valid JWT token (isAdmin: true)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin JWT token
    await requireAdmin(request);

    const stats = await getPlatformStats();

    return success({ stats });
  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return unauthorized(error.message);
    }
    return handleError(error);
  }
}
