import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/auth';
import { handleError } from '@/lib/api/error-handler';
import { success } from '@/lib/api/responses';
import { getDashboardStats } from '@/lib/services/admin/dashboard-stats.service';

/**
 * GET /api/admin/dashboard/stats
 *
 * Get dashboard statistics for admin panel (admin only)
 *
 * Returns:
 * - totalValueLocked: Sum of all active raffle prize pools
 * - activeRafflesCount: Number of active raffles
 * - endingSoonCount: Number of raffles ending soon (displayStatus = 'ending')
 * - entriesToday: Number of entries created today (since midnight)
 * - revenueThisWeek: Sum of protocol fees from last 7 days
 *
 * Requires: Authorization header with valid admin JWT token
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin JWT token
    await requireAdmin(request);

    const stats = await getDashboardStats();

    return success({ stats });
  } catch (error) {
    return handleError(error);
  }
}
