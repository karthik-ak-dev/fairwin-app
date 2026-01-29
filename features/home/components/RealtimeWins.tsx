'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import WinFeedItem from './WinFeedItem';
import { formatUSDC, formatAddress, formatTimeAgo } from '@/shared/utils/format';
import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/shared/components/ui';
import type { WinnerItem } from '@/lib/db/models';

export default function RealtimeWins() {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-winners'],
    queryFn: () =>
      apiClient.get<{ winners: WinnerItem[] }>('/admin/winners', { limit: '6' }),
    staleTime: 30_000,
  });

  const winners: WinnerItem[] = data?.winners ?? [];

  return (
    <section className="py-24 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left — Heading */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/[0.05] px-4 py-1.5 mb-4">
              <span className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />
              <span className="text-xs font-medium text-[#00ff88] uppercase tracking-[0.15em]">
                Real-time
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recent Winners
            </h2>
            <p className="text-[#888888] text-base leading-relaxed mb-6">
              Every win is verified on-chain. Watch the latest winners in real
              time — each one selected by Chainlink VRF with a cryptographic
              proof of fairness.
            </p>
            <Link
              href="/winners"
              className="inline-flex items-center text-sm text-[#00ff88] hover:underline"
            >
              View All Winners →
            </Link>
          </div>

          {/* Right — Feed */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : winners.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-2">🏆</span>
                <p className="text-sm text-[#888888]">No winners yet. Be the first!</p>
              </div>
            ) : (
              winners.map((win, i) => (
                <WinFeedItem
                  key={`${win.raffleId}-${win.rank}-${i}`}
                  wallet={formatAddress(win.walletAddress)}
                  raffle={`Raffle #${win.raffleId.slice(0, 8)}`}
                  prize={formatUSDC(win.prize)}
                  time={formatTimeAgo(win.createdAt)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
