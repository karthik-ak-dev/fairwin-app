'use client';

import { useRaffles } from '@/features/raffle/hooks/useRaffles';
import { formatUSDC, formatNumber, formatTime } from '@/shared/utils/format';
import DrawRow from './DrawRow';
import { Skeleton } from '@/shared/components/ui';

export default function LiveDraws() {
  const { raffles, isLoading } = useRaffles();

  // Map real raffles to draw rows
  const draws = raffles.slice(0, 5).map((raffle) => {
    const endTime = new Date(raffle.endTime).getTime();
    const remainingSec = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    const isExpired = remainingSec <= 0;

    let status: 'live' | 'drawing' | 'ended';
    let timeLeft: string;

    if (raffle.state === 'drawing') {
      status = 'drawing';
      timeLeft = 'Drawing...';
    } else if (raffle.state === 'ended') {
      status = 'ended';
      timeLeft = 'Ended';
    } else if (isExpired) {
      status = 'ended';
      timeLeft = 'Ended';
    } else {
      status = 'live';
      timeLeft = formatTime(remainingSec);
    }

    return {
      name: raffle.title,
      pool: formatUSDC(raffle.prizePool),
      entries: formatNumber(raffle.totalEntries),
      timeLeft,
      status,
    };
  });

  return (
    <section className="py-16 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Live Draws</h2>
          <div className="flex items-center gap-4 text-xs text-[#888888] uppercase tracking-[0.1em]">
            <span className="w-20 text-right">Pool</span>
            <span className="w-20 text-right">Entries</span>
            <span className="w-20 text-right">Time</span>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-white/[0.08] overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4 border-b border-white/[0.05] last:border-b-0">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        ) : draws.length === 0 ? (
          <div className="rounded-xl border border-white/[0.08] p-8 text-center">
            <span className="text-2xl block mb-2">🎲</span>
            <p className="text-sm text-[#888888]">No active draws right now</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.08] overflow-hidden">
            {draws.map((draw, i) => (
              <DrawRow key={i} {...draw} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
