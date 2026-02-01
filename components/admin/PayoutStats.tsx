'use client';

// ============================================================================
// Winners & Payouts — Stat Cards (real data)
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { useAdmin } from '@/shared/hooks/useAdmin';
import { getAdminStats } from '@/lib/api/admin';
import { formatUSDC } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';

export default function PayoutStats() {
  const { address, isAdmin } = useAdmin();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats', address],
    queryFn: () => getAdminStats(address!),
    enabled: !!address && isAdmin,
    staleTime: 15_000,
  });

  const payoutStats = data?.stats?.payoutStats;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = [
    { label: 'Total Paid Out', value: formatUSDC(payoutStats?.totalPaid ?? 0), highlight: true },
    { label: 'This Month', value: formatUSDC(payoutStats?.thisMonth ?? 0) },
    { label: 'This Week', value: formatUSDC(payoutStats?.thisWeek ?? 0) },
    { label: 'Avg Payout', value: formatUSDC(payoutStats?.avgPayout ?? 0) },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-xl border px-5 py-4 ${
            s.highlight
              ? 'border-[#00ff88]/20 bg-[#00ff88]/[0.06]'
              : 'border-white/[0.06] bg-[#111111]'
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">
            {s.label}
          </p>
          <p
            className={`mt-1 text-[28px] font-bold leading-tight ${
              s.highlight ? 'text-[#00ff88]' : 'text-white'
            }`}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
