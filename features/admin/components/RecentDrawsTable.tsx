'use client';

// ============================================================================
// Admin Dashboard — Recent Draws Table (real data)
// ============================================================================

import { useAdminRaffles } from '@/features/admin/hooks/useAdminRaffles';
import { formatUSDC, formatTimeAgo, formatAddress } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';

export default function RecentDrawsTable() {
  const { raffles, isLoading, error } = useAdminRaffles({ filter: 'all' });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <Skeleton className="w-28 h-4" />
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-6 text-center">
        <p className="text-sm text-red-400">Failed to load recent draws</p>
      </div>
    );
  }

  // Filter for completed raffles
  const completedRaffles = raffles
    .filter((r) => r.state === 'ended')
    .slice(0, 5);

  if (completedRaffles.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-6 text-center">
        <span className="text-2xl block mb-2">🎲</span>
        <p className="text-sm text-[#888]">No completed draws yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Recent Draws</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-[#666]">
              <th className="text-left px-5 py-3 font-medium">Raffle</th>
              <th className="text-right px-4 py-3 font-medium">Pool</th>
              <th className="text-right px-4 py-3 font-medium">Entries</th>
              <th className="text-right px-5 py-3 font-medium">Ended</th>
            </tr>
          </thead>
          <tbody>
            {completedRaffles.map((r) => (
              <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-white font-medium">{r.title}</td>
                <td className="px-4 py-3 text-right text-[#00ff88] font-semibold">
                  {formatUSDC(r.prizePool)}
                </td>
                <td className="px-4 py-3 text-right text-[#ccc]">{r.totalEntries}</td>
                <td className="px-5 py-3 text-right text-[#888]">
                  {formatTimeAgo(r.endTime)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
