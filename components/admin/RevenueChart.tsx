'use client';

// ============================================================================
// Admin Dashboard — Revenue Chart (real data)
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { useAdmin } from '@/shared/hooks/useAdmin';
import { getAdminStats } from '@/lib/api/admin';
import { formatUSDC } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';

export default function RevenueChart() {
  const { address, isAdmin } = useAdmin();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats', address],
    queryFn: () => getAdminStats(address!),
    enabled: !!address && isAdmin,
    staleTime: 15_000,
  });

  if (isLoading) {
    return <Skeleton className="h-[280px] rounded-xl" />;
  }

  const stats = data?.stats;
  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalPaidOut = stats?.totalPaidOut ?? 0;
  const netRevenue = totalRevenue;

  return (
    <div className="bg-[#0a0a0a] border border-[#222] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white">Revenue Overview</h3>
          <p className="text-xs text-[#888] mt-0.5">Protocol fees collected</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[#00ff88]">{formatUSDC(netRevenue)}</p>
          <p className="text-xs text-[#888]">Total revenue</p>
        </div>
      </div>

      {/* Simple stat bars */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[#888]">Total Revenue</span>
            <span className="text-[#00ff88] font-semibold">{formatUSDC(totalRevenue)}</span>
          </div>
          <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00ff88] to-[#00ff88]/60 transition-all duration-500"
              style={{ width: totalRevenue > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[#888]">Total Paid Out</span>
            <span className="text-white font-semibold">{formatUSDC(totalPaidOut)}</span>
          </div>
          <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-400/60 transition-all duration-500"
              style={{
                width: totalRevenue > 0 ? `${Math.min(100, (totalPaidOut / (totalRevenue || 1)) * 100)}%` : '0%',
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-[#222] flex items-center justify-between text-xs text-[#888]">
        <span>Revenue: {formatUSDC(totalRevenue)}</span>
        <span>Paid Out: {formatUSDC(totalPaidOut)}</span>
        <span>Net: {formatUSDC(totalRevenue - totalPaidOut)}</span>
      </div>
    </div>
  );
}
