'use client';

import { Card, CardContent } from '@/shared/components/ui';
import { cn } from '@/shared/utils/cn';
import { formatUSDC, formatPercent } from '@/shared/utils/format';
import type { UserProfile } from '@/features/account/types';

interface AccountStatsProps {
  stats?: UserProfile;
  isLoading?: boolean;
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="py-5 animate-pulse">
        <div className="w-20 h-3 rounded bg-white/[0.04] mb-3" />
        <div className="w-28 h-8 rounded bg-white/[0.06] mb-2" />
        <div className="w-24 h-3 rounded bg-white/[0.04]" />
      </CardContent>
    </Card>
  );
}

export default function AccountStats({ stats, isLoading }: AccountStatsProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: 'Total Won',
      value: formatUSDC(stats.totalWon),
      valueColor: 'text-[#00ff88]',
    },
    {
      label: 'Raffles Entered',
      value: String(stats.rafflesEntered),
    },
    {
      label: 'Win Rate',
      value: formatPercent(stats.winRate * 100, 1),
    },
    {
      label: 'Active Entries',
      value: String(stats.activeEntries),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statItems.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="py-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888] mb-2">
              {stat.label}
            </p>
            <p
              className={cn(
                'text-[32px] font-bold leading-tight tracking-tight',
                stat.valueColor ?? 'text-white'
              )}
            >
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
