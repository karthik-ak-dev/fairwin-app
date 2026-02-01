'use client';

import { useRaffles } from '@/lib/hooks/raffle/useRaffles';
import GameCard from './GameCard';
import { formatUSDC, formatTime } from '@/shared/utils/format';

function GameCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 rounded bg-white/[0.06]" />
        <div className="w-16 h-6 rounded-full bg-white/[0.06]" />
      </div>
      <div className="w-32 h-5 rounded bg-white/[0.06] mb-1" />
      <div className="w-20 h-3 rounded bg-white/[0.04] mb-4" />
      <div className="mb-4">
        <div className="w-16 h-3 rounded bg-white/[0.04] mb-1" />
        <div className="w-24 h-8 rounded bg-white/[0.06]" />
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.08] mb-5" />
      <div className="w-full h-10 rounded-lg bg-white/[0.06]" />
    </div>
  );
}

export default function GamesGrid() {
  const { raffles, isLoading } = useRaffles({ status: 'active' });

  // Show only active / ending raffles, limit to 4
  const activeRaffles = raffles
    .filter((r) => r.state === 'active' || r.state === 'ending')
    .slice(0, 4);

  return (
    <section className="py-24">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Active Raffles
            </h2>
            <p className="text-[#888888] text-sm mt-1">
              Enter now for a chance to win
            </p>
          </div>
          <a
            href="/games/raffle"
            className="text-sm text-[#00ff88] hover:underline"
          >
            View All →
          </a>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        ) : activeRaffles.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <span className="text-3xl block mb-2">🎟️</span>
            <p className="text-sm text-[#888888]">No active raffles right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeRaffles.map((raffle) => {
              const endTime = new Date(raffle.endTime).getTime();
              const remainingSec = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
              const isEnding = raffle.state === 'ending' || remainingSec < 3600;

              // Map raffle type to icon
              const iconMap: Record<string, string> = {
                daily: '🎰',
                weekly: '💎',
                monthly: '🏆',
                flash: '🎲',
                mega: '💰',
              };

              return (
                <GameCard
                  key={raffle.id}
                  id={raffle.id}
                  name={raffle.title}
                  prizePool={formatUSDC(raffle.prizePool)}
                  entries={raffle.totalEntries}
                  maxEntries={raffle.maxEntriesPerUser * raffle.totalParticipants || raffle.totalEntries + 100}
                  endsIn={formatTime(remainingSec)}
                  icon={iconMap[raffle.type] || '🎰'}
                  status={isEnding ? 'ending' : 'live'}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
