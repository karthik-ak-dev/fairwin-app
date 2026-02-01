'use client';

// ============================================================================
// Admin Raffle Detail — Stats Row (accepts props)
// ============================================================================

import { formatUSDC, formatNumber } from '@/shared/utils/format';
import type { Raffle } from '@/features/raffle/types';

interface AdminRaffleStatsProps {
  raffle?: Raffle;
}

export default function AdminRaffleStats({ raffle }: AdminRaffleStatsProps) {
  if (!raffle) return null;

  const stats = [
    { label: 'Pool', value: formatUSDC(raffle.prizePool), highlight: true },
    { label: 'Entries', value: formatNumber(raffle.totalEntries), highlight: false },
    { label: 'Participants', value: formatNumber(raffle.totalParticipants), highlight: false },
    { label: 'Avg / User', value: raffle.totalParticipants > 0 ? (raffle.totalEntries / raffle.totalParticipants).toFixed(1) : '0', highlight: false },
    { label: 'Winner Gets', value: formatUSDC(raffle.prizePool * 0.9), highlight: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`rounded-xl border px-4 py-3 text-center ${
            s.highlight
              ? 'bg-[#00ff88]/[0.06] border-[#00ff88]/20'
              : 'bg-[#111111] border-white/[0.06]'
          }`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#888]">
            {s.label}
          </p>
          <p className={`mt-1 text-xl font-bold ${s.highlight ? 'text-[#00ff88]' : 'text-white'}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
