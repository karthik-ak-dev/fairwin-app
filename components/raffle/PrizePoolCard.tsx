import { formatUSDC, formatNumber } from '@/shared/utils/format';
import type { RaffleState } from '@/features/raffle/types';

interface PrizePoolCardProps {
  prizePool: number;
  totalEntries: number;
  status: RaffleState;
}

export default function PrizePoolCard({ prizePool, totalEntries, status }: PrizePoolCardProps) {
  const isEnding = status === 'ending';
  const isActive = status === 'active';
  const winnerPayout = prizePool * 0.9;

  return (
    <div
      className={`
        relative rounded-2xl border p-8 overflow-hidden
        ${
          isEnding
            ? 'border-[#f97316]/30 bg-gradient-to-br from-[#f97316]/5 to-transparent'
            : isActive
            ? 'border-[#00ff88]/20 bg-gradient-to-br from-[#00ff88]/5 to-transparent'
            : 'border-white/[0.08] bg-[#0a0a0a]'
        }
      `}
    >
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${
          isEnding ? 'bg-[#f97316]' : 'bg-[#00ff88]'
        }`}
      />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          {(isActive || isEnding) && (
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isEnding ? 'bg-[#f97316]' : 'bg-[#00ff88]'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isEnding ? 'bg-[#f97316]' : 'bg-[#00ff88]'
                }`}
              />
            </span>
          )}
          <span className="text-sm text-[#888888] font-medium uppercase tracking-wider">
            Current Prize Pool
          </span>
        </div>

        <p
          className={`text-[56px] font-bold leading-none mb-3 ${
            isEnding ? 'text-[#f97316]' : 'text-[#00ff88]'
          }`}
        >
          {formatUSDC(prizePool)}
        </p>

        <div className="flex items-center gap-4 text-sm text-[#888888]">
          <span>Winner payout: <span className="text-white font-semibold">{formatUSDC(winnerPayout)}</span></span>
          <span>•</span>
          <span>{formatNumber(totalEntries)} entries</span>
        </div>
      </div>
    </div>
  );
}
