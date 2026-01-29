'use client';

import { useRaffles } from '@/features/raffle/hooks/useRaffles';
import { formatUSDC, formatNumber } from '@/shared/utils/format';

function StatSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-sm animate-pulse">
      <div className="w-12 h-12 rounded-xl bg-white/[0.05]" />
      <div>
        <div className="w-20 h-6 rounded bg-white/[0.06] mb-1" />
        <div className="w-16 h-3 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

export default function HeroStats() {
  const { raffles, isLoading } = useRaffles();

  if (isLoading) {
    return (
      <div className="w-full max-w-[380px] space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const totalPrizePool = raffles.reduce((sum, r) => sum + r.prizePool, 0);
  const totalPlayers = raffles.reduce((sum, r) => sum + r.totalParticipants, 0);
  const avgPrize = raffles.length > 0 ? totalPrizePool / raffles.length : 0;

  const stats = [
    {
      label: 'Total Prize Pools',
      value: formatUSDC(totalPrizePool),
      icon: '💰',
    },
    {
      label: 'Active Players',
      value: formatNumber(totalPlayers),
      icon: '👥',
    },
    {
      label: 'Avg Pool',
      value: formatUSDC(avgPrize),
      icon: '🏆',
    },
  ];

  return (
    <div className="w-full max-w-[380px] space-y-4">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-sm"
        >
          <span className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center text-2xl flex-shrink-0">
            {stat.icon}
          </span>
          <div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-[#888888] uppercase tracking-[0.1em]">
              {stat.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
