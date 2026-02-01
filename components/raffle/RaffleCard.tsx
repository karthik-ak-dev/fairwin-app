import Link from 'next/link';
import type { Raffle } from '@/features/raffle/types';
import { RAFFLE_TYPES, RAFFLE_STATE_CONFIG } from '@/features/raffle/constants';
import { formatUSDC, formatNumber } from '@/shared/utils/format';
import RaffleTimer from './RaffleTimer';

interface RaffleCardProps {
  raffle: Raffle;
}

export default function RaffleCard({ raffle }: RaffleCardProps) {
  const typeConfig = RAFFLE_TYPES.find((t) => t.value === raffle.type);
  const stateConfig = RAFFLE_STATE_CONFIG[raffle.state];
  const isLive = raffle.state === 'active';
  const isEnding = raffle.state === 'ending';
  const isEnded = raffle.state === 'ended';

  const winnersCount = Math.max(1, Math.ceil(raffle.totalEntries * 0.1));

  return (
    <Link href={`/games/raffle/${raffle.id}`} className="block group">
      <div
        className={`
          relative rounded-2xl border bg-[#0a0a0a] p-6
          transition-all duration-300
          group-hover:-translate-y-1 group-hover:shadow-lg
          ${
            isEnding
              ? 'border-[#f97316]/30 group-hover:border-[#f97316]/50 group-hover:shadow-[#f97316]/10'
              : isEnded
              ? 'border-white/[0.06] group-hover:border-white/[0.12]'
              : 'border-white/[0.08] group-hover:border-[#00ff88]/30 group-hover:shadow-[#00ff88]/5'
          }
        `}
      >
        {/* Top: Icon + Title + Status Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{typeConfig?.icon ?? '🎟️'}</span>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {raffle.title}
              </h3>
              <p className="text-xs text-[#888888] mt-0.5">
                {typeConfig?.label} Raffle • {formatUSDC(raffle.entryPrice)} / entry
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <span
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider
              ${stateConfig.bgColor} ${stateConfig.color} ${stateConfig.borderColor} border
            `}
          >
            {(isLive || isEnding) && (
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stateConfig.dotColor}`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${stateConfig.dotColor}`}
                />
              </span>
            )}
            {isLive ? 'LIVE' : isEnding ? 'ENDING' : stateConfig.label.toUpperCase()}
          </span>
        </div>

        {/* Prize Pool */}
        <div className="mb-4">
          <p className="text-xs text-[#888888] mb-1">Prize Pool</p>
          <p
            className={`text-3xl font-bold ${
              isEnding ? 'text-[#f97316]' : isEnded ? 'text-[#888888]' : 'text-[#00ff88]'
            }`}
          >
            {formatUSDC(raffle.prizePool)}
          </p>
        </div>

        {/* Entries + Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-[#888888]">
            <span className="text-white font-semibold">
              {formatNumber(raffle.totalEntries)}
            </span>{' '}
            entries
          </div>
          {!isEnded ? (
            <RaffleTimer endTime={raffle.endTime} compact />
          ) : (
            <span className="text-xs text-[#888888]">Ended</span>
          )}
        </div>

        {/* Winners Info */}
        <div className="text-xs text-[#888888] mb-5">
          Current Winners:{' '}
          <span className="text-[#00ff88] font-medium">{winnersCount}</span>
          <span className="ml-1 opacity-60">(top 10%)</span>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] my-4" />

        {/* Bottom: Price + Enter Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#888888]">Entry Price</p>
            <p className="text-sm font-semibold text-white">
              {formatUSDC(raffle.entryPrice)} USDC
            </p>
          </div>
          {!isEnded ? (
            <span
              className={`
                px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide
                transition-all duration-200
                ${
                  isEnding
                    ? 'bg-[#f97316] text-black group-hover:brightness-110'
                    : 'bg-[#00ff88] text-black group-hover:brightness-110'
                }
              `}
            >
              Enter
            </span>
          ) : (
            <span className="px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wide bg-white/[0.05] text-[#888888]">
              View Results
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
