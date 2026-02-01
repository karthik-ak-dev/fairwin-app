'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/shared/components/ui';
import { formatUSDC, formatDate } from '@/shared/utils/format';
import { getUserWins } from '@/lib/api/account';
import type { WinnerItem } from '@/lib/db/models';

interface WinsListProps {
  address?: string;
}

const TIER_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  'grand': {
    color: 'text-[#FFD700]',
    bg: 'bg-[#FFD700]/10',
    border: 'border-[#FFD700]/25',
    label: '🥇 Grand Prize',
  },
  'runner-up': {
    color: 'text-[#C0C0C0]',
    bg: 'bg-[#C0C0C0]/10',
    border: 'border-[#C0C0C0]/25',
    label: '🥈 Runner-up',
  },
  'lucky': {
    color: 'text-[#00ff88]',
    bg: 'bg-[#00ff88]/10',
    border: 'border-[#00ff88]/25',
    label: '🍀 Lucky Winner',
  },
};

function WinsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Your Wins</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.08] p-5">
              <div className="flex justify-between">
                <div>
                  <div className="w-32 h-4 rounded bg-white/[0.06] mb-2" />
                  <div className="w-20 h-3 rounded bg-white/[0.04]" />
                </div>
                <div className="w-24 h-8 rounded bg-white/[0.06]" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WinsList({ address }: WinsListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-wins', address],
    queryFn: () => getUserWins(address!),
    enabled: !!address,
    staleTime: 15_000,
  });

  const wins: WinnerItem[] = data?.wins ?? [];

  if (isLoading) {
    return <WinsListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Your Wins</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400 py-4 text-center">
            Failed to load wins. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (wins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Your Wins</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#888888] py-8 text-center">
            No wins yet. Keep entering raffles for your chance to win!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Your Wins</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {wins.map((win: WinnerItem) => {
            const tierStyle = TIER_STYLES[win.tier] || TIER_STYLES['lucky'];
            return (
              <div
                key={win.winnerId}
                className={`rounded-xl border ${tierStyle.border} ${tierStyle.bg} p-5 transition-colors hover:bg-white/[0.04]`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: raffle info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-white">
                        Raffle #{win.raffleId.slice(0, 8)}
                      </span>
                    </div>

                    {/* Tier label */}
                    <span className={`text-xs font-semibold ${tierStyle.color}`}>
                      {tierStyle.label}
                    </span>

                    {/* Date */}
                    <p className="text-xs text-[#888888] mt-1">
                      {formatDate(win.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Right: prize + verify link */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-2xl font-bold text-[#00ff88]">
                      {formatUSDC(win.prize)}
                    </span>
                    {win.transactionHash && (
                      <a
                        href={`https://polygonscan.com/tx/${win.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#888888] hover:text-[#00ff88] font-medium transition-colors"
                      >
                        Verify →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
