'use client';

import Link from 'next/link';

export interface GameCardProps {
  id: string;
  name: string;
  prizePool: string;
  entries: number;
  maxEntries: number;
  endsIn: string;
  icon: string;
  status: 'live' | 'ending' | 'upcoming';
}

export default function GameCard({
  id,
  name,
  prizePool,
  entries,
  maxEntries,
  endsIn,
  icon,
  status,
}: GameCardProps) {
  const fillPct = Math.min((entries / maxEntries) * 100, 100);
  const isEnding = status === 'ending';

  return (
    <div
      className={`rounded-xl border p-6 transition-all hover:translate-y-[-2px] ${
        isEnding
          ? 'border-orange-500/30 bg-orange-500/[0.03]'
          : 'border-white/[0.08] bg-white/[0.02] hover:border-[#00ff88]/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.1em] ${
            isEnding
              ? 'bg-orange-500/15 text-orange-400'
              : status === 'live'
              ? 'bg-[#00ff88]/15 text-[#00ff88]'
              : 'bg-white/[0.08] text-[#888888]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isEnding
                ? 'bg-orange-400 animate-pulse'
                : status === 'live'
                ? 'bg-[#00ff88] animate-pulse'
                : 'bg-[#888888]'
            }`}
          />
          {isEnding ? 'Ending Soon' : status === 'live' ? 'Live' : 'Upcoming'}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-white font-semibold mb-1">{name}</h3>
      <p className="text-xs text-[#888888] mb-4">Ends in {endsIn}</p>

      {/* Prize Pool */}
      <div className="mb-4">
        <p className="text-xs text-[#888888] uppercase tracking-[0.1em] mb-1">
          Prize Pool
        </p>
        <p className="text-2xl font-bold text-[#00ff88]">{prizePool}</p>
      </div>

      {/* Entries Progress */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-[#888888] mb-1.5">
          <span>{entries.toLocaleString()} entries</span>
          <span>{maxEntries.toLocaleString()} max</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isEnding ? 'bg-orange-400' : 'bg-[#00ff88]'
            }`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/games/raffle/${id}`}
        className={`w-full flex items-center justify-center rounded-lg py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${
          isEnding
            ? 'bg-orange-500 text-white'
            : 'bg-[#00ff88] text-black'
        }`}
      >
        Enter Now
      </Link>
    </div>
  );
}
