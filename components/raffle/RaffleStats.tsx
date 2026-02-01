import { formatNumber, formatUSDC } from '@/shared/utils/format';
import type { Raffle } from '@/features/raffle/types';

interface RaffleStatsProps {
  raffle: Raffle;
}

export default function RaffleStats({ raffle }: RaffleStatsProps) {
  const stats = [
    {
      label: 'Total Entries',
      value: formatNumber(raffle.totalEntries),
      suffix: '& counting',
      icon: '🎟️',
    },
    {
      label: 'Participants',
      value: formatNumber(raffle.totalParticipants),
      suffix: 'unique wallets',
      icon: '👥',
    },
    {
      label: 'Entry Price',
      value: formatUSDC(raffle.entryPrice),
      suffix: 'per ticket',
      icon: '💵',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-5 text-center"
        >
          <span className="text-2xl mb-2 block">{stat.icon}</span>
          <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
          <p className="text-xs text-[#888888] font-medium uppercase tracking-wider">
            {stat.label}
          </p>
          <p className="text-[10px] text-[#00ff88] mt-1">{stat.suffix}</p>
        </div>
      ))}
    </div>
  );
}
