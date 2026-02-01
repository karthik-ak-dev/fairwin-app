import Link from 'next/link';
import { RAFFLE_TYPES, RAFFLE_STATE_CONFIG } from '@/features/raffle/constants';
import { formatUSDC } from '@/shared/utils/format';
import type { Raffle } from '@/features/raffle/types';
import RaffleTimer from './RaffleTimer';

interface RaffleHeaderProps {
  raffle: Raffle;
}

export default function RaffleHeader({ raffle }: RaffleHeaderProps) {
  const typeConfig = RAFFLE_TYPES.find((t) => t.value === raffle.type);
  const stateConfig = RAFFLE_STATE_CONFIG[raffle.state];
  const isLive = raffle.state === 'active' || raffle.state === 'ending';

  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#888888] mb-6">
        <Link href="/" className="hover:text-white transition-colors">
          Games
        </Link>
        <span className="text-[#555]">/</span>
        <Link
          href="/games/raffle"
          className="hover:text-white transition-colors"
        >
          Raffle
        </Link>
        <span className="text-[#555]">/</span>
        <span className="text-white">{raffle.title}</span>
      </nav>

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Icon + Title */}
        <div className="flex items-center gap-5">
          {/* Large Emoji Icon */}
          <span className="text-[72px] leading-none flex-shrink-0">
            {typeConfig?.icon ?? '🎟️'}
          </span>

          <div>
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-2">
              {raffle.title}
            </h1>

            {/* Subtitle line */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Type badge */}
              <span
                className={`
                  inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border
                  ${typeConfig?.colorClass ?? 'text-[#888888] bg-white/[0.05] border-white/[0.08]'}
                `}
              >
                {typeConfig?.label ?? raffle.type} Raffle
              </span>

              {/* Entry price */}
              <span className="text-sm text-[#888888]">
                <span className="text-white font-semibold">
                  {formatUSDC(raffle.entryPrice)}
                </span>{' '}
                per entry
              </span>
            </div>
          </div>
        </div>

        {/* Right: Status + Timer */}
        <div className="flex flex-col items-start lg:items-end gap-3">
          {/* Status Badge */}
          <span
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border
              ${stateConfig.bgColor} ${stateConfig.color} ${stateConfig.borderColor}
            `}
          >
            {isLive && (
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${stateConfig.dotColor}`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${stateConfig.dotColor}`}
                />
              </span>
            )}
            {stateConfig.label}
          </span>

          {/* Timer */}
          {isLive && <RaffleTimer endTime={raffle.endTime} compact />}
        </div>
      </div>
    </div>
  );
}
