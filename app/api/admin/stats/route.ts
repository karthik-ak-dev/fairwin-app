import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorized } from '@/lib/api/admin-auth';
import { statsRepo } from '@/lib/db/repositories';
import { serverError } from '@/lib/api/validate';

const ZERO_STATS = {
  totalRevenue: 0,
  totalPaidOut: 0,
  totalRaffles: 0,
  totalEntries: 0,
  totalUsers: 0,
  totalWinners: 0,
};

export async function GET(request: NextRequest) {
  try {
    if (!isAdmin(request)) return unauthorized();

    const stats = await statsRepo.get();

    return NextResponse.json({
      stats: stats
        ? {
            totalRevenue: stats.totalRevenue,
            revenueThisMonth: 0, // Computed downstream if needed
            activeRaffles: 0,    // Computed downstream if needed
            totalEntries: stats.totalEntries,
            totalUsers: stats.totalUsers,
            totalPaidOut: stats.totalPaidOut,
            avgPoolSize: 0,      // Computed downstream if needed
            payoutStats: {
              totalPaid: stats.totalPaidOut,
              thisMonth: 0,
              thisWeek: 0,
              avgPayout: stats.totalWinners > 0 ? stats.totalPaidOut / stats.totalWinners : 0,
              totalCount: stats.totalWinners,
              pendingCount: 0,
            },
          }
        : {
            ...ZERO_STATS,
            revenueThisMonth: 0,
            activeRaffles: 0,
            avgPoolSize: 0,
            payoutStats: { totalPaid: 0, thisMonth: 0, thisWeek: 0, avgPayout: 0, totalCount: 0, pendingCount: 0 },
          },
    });
  } catch (error) {
    console.error('GET /api/admin/stats error:', error);
    return serverError();
  }
}
