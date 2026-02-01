import { formatUSDC } from '@/shared/utils/format';

interface PrizeBreakdownProps {
  prizePool: number;
  totalEntries: number;
}

const TIERS = [
  {
    icon: '🥇',
    name: 'Grand Prize',
    percentage: 40,
    winnersCount: 1,
    colorClass: 'text-[#FFD700]',
    borderClass: 'border-[#FFD700]/20',
    bgClass: 'bg-[#FFD700]/5',
  },
  {
    icon: '🥈',
    name: 'Runner-ups',
    percentage: 30,
    winnersCount: 4,
    colorClass: 'text-[#C0C0C0]',
    borderClass: 'border-[#C0C0C0]/20',
    bgClass: 'bg-[#C0C0C0]/5',
  },
  {
    icon: '🎉',
    name: 'Lucky Winners',
    percentage: 30,
    winnersCountFn: (total: number) => Math.max(1, Math.ceil(total * 0.1) - 5),
    colorClass: 'text-[#00ff88]',
    borderClass: 'border-[#00ff88]/20',
    bgClass: 'bg-[#00ff88]/5',
  },
];

export default function PrizeBreakdown({
  prizePool,
  totalEntries,
}: PrizeBreakdownProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
      <h3 className="text-lg font-bold text-white mb-5">Prize Breakdown</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier) => {
          const tierPool = prizePool * (tier.percentage / 100);
          const winnersCount =
            'winnersCountFn' in tier && tier.winnersCountFn
              ? tier.winnersCountFn(totalEntries)
              : tier.winnersCount;
          const perWinner = winnersCount > 0 ? tierPool / winnersCount : 0;

          return (
            <div
              key={tier.name}
              className={`rounded-xl border ${tier.borderClass} ${tier.bgClass} p-5 text-center`}
            >
              <span className="text-4xl mb-3 block">{tier.icon}</span>
              <h4 className={`text-sm font-bold ${tier.colorClass} mb-1`}>
                {tier.name}
              </h4>
              <p className="text-[#888888] text-xs mb-3">
                {tier.percentage}% of pool &bull;{' '}
                {winnersCount} winner{winnersCount !== 1 ? 's' : ''}
              </p>
              <p className={`text-2xl font-bold ${tier.colorClass}`}>
                {formatUSDC(tierPool)}
              </p>
              <p className="text-xs text-[#888888] mt-1">
                {formatUSDC(perWinner)} per winner
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
