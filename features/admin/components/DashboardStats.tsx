'use client';

// ============================================================================
// Admin Dashboard — Stat Cards
// ============================================================================

import type { AdminStats } from '@/features/admin/types';
import { formatUSDC, formatNumber } from '@/shared/utils/format';

interface DashboardStatsProps {
  stats?: AdminStats;
  isLoading?: boolean;
}

function StatSkeleton() {
  return (
    <div className="rounded-xl border bg-[#111111] border-white/[0.06] px-5 py-4 animate-pulse">
      <div className="w-20 h-3 rounded bg-white/[0.04] mb-2" />
      <div className="w-28 h-8 rounded bg-white/[0.06] mb-2" />
      <div className="w-16 h-3 rounded bg-white/[0.04]" />
    </div>
  );
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Revenue',
      value: formatUSDC(stats.totalRevenue),
      sub: `${formatUSDC(stats.revenueThisMonth)} this month`,
      highlight: true,
    },
    {
      label: 'Active Raffles',
      value: String(stats.activeRaffles),
      sub: 'currently running',
      highlight: false,
    },
    {
      label: 'Total Entries',
      value: formatNumber(stats.totalEntries),
      sub: 'all time',
      highlight: false,
    },
    {
      label: 'Total Players',
      value: formatNumber(stats.totalPlayers),
      sub: `Avg pool: ${formatUSDC(stats.avgPoolSize)}`,
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((s) => (
        <div
          key={s.label}
          className={`rounded-xl border px-5 py-4 ${
            s.highlight
              ? 'bg-[#00ff88]/[0.06] border-[#00ff88]/20'
              : 'bg-[#111111] border-white/[0.06]'
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
          <p className="mt-1 text-xs text-[#666]">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
