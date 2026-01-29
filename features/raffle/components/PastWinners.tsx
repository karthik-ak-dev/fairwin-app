'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatUSDC, formatTimeAgo } from '@/shared/utils/format';
import { getWinners } from '@/features/raffle/api';
import type { WinnerItem } from '@/lib/db/models';

interface PastWinnersProps {
  raffleId: string;
}

function PastWinnersSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="w-32 h-5 rounded bg-white/[0.06]" />
        <div className="w-16 h-4 rounded bg-white/[0.04]" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-white/[0.04]" />
              <div>
                <div className="w-24 h-4 rounded bg-white/[0.06] mb-1" />
                <div className="w-16 h-3 rounded bg-white/[0.04]" />
              </div>
            </div>
            <div className="w-16 h-4 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PastWinners({ raffleId }: PastWinnersProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['raffle-winners', raffleId],
    queryFn: () => getWinners(raffleId),
    enabled: !!raffleId,
    staleTime: 30_000,
  });

  const winners: WinnerItem[] = data?.winners ?? [];

  if (isLoading) {
    return <PastWinnersSkeleton />;
  }

  if (error || winners.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Recent Winners</h3>
          <Link href="/winners" className="text-sm text-[#00ff88] hover:underline">
            View All →
          </Link>
        </div>
        <div className="text-center py-6">
          <span className="text-2xl block mb-2">🏆</span>
          <p className="text-sm text-[#888888]">No winners yet for this raffle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-white">Recent Winners</h3>
        <Link
          href="/winners"
          className="text-sm text-[#00ff88] hover:underline"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-3">
        {winners.slice(0, 5).map((winner: WinnerItem, i: number) => (
          <div
            key={winner.winnerId}
            className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🎉'}
              </span>
              <div>
                <p className="text-sm font-mono text-white">
                  {winner.walletAddress.slice(0, 6)}...{winner.walletAddress.slice(-4)}
                </p>
                <p className="text-xs text-[#888888]">{winner.tier}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#00ff88]">
                {formatUSDC(winner.prize)}
              </p>
              {winner.transactionHash && (
                <a
                  href={`https://polygonscan.com/tx/${winner.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#888888] hover:text-[#00ff88] transition-colors"
                >
                  Verify ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
