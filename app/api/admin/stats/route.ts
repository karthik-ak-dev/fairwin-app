import { NextRequest } from 'next/server';
import { isAdmin } from '@/lib/api/admin-auth';
import { handleError, unauthorized } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getPlatformStats } from '@/lib/services/admin/admin-stats.service';

/**
 * GET /api/admin/stats
 *
 * Get platform statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return unauthorized();
    }

    const stats = await getPlatformStats();

    return success({ stats });
  } catch (error) {
    return handleError(error);
  }
}
