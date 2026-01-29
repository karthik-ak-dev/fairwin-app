'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import { apiClient } from '@/lib/api/client';
import { formatUSDC, formatAddress, formatTimeAgo } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';
import type { WinnerItem } from '@/lib/db/models';

export default function WinnersPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['public-winners'],
    queryFn: () =>
      apiClient.get<{ winners: WinnerItem[] }>('/admin/winners', { limit: '50' }),
    staleTime: 30_000,
  });

  const winners: WinnerItem[] = data?.winners ?? [];

  const filtered = search
    ? winners.filter((w) => {
        const q = search.toLowerCase();
        return (
          w.walletAddress.toLowerCase().includes(q) ||
          w.raffleId.toLowerCase().includes(q)
        );
      })
    : winners;

  // Top 3 for podium
  const topWinners = [...winners]
    .sort((a, b) => b.prize - a.prize)
    .slice(0, 3);

  const totalPaidOut = winners.reduce((sum, w) => sum + w.prize, 0);

  const PODIUM_CONFIG = [
    { emoji: '🥇', color: 'border-[#FFD700]/30 bg-[#FFD700]/[0.05]', textColor: 'text-[#FFD700]' },
    { emoji: '🥈', color: 'border-[#C0C0C0]/30 bg-[#C0C0C0]/[0.05]', textColor: 'text-[#C0C0C0]' },
    { emoji: '🥉', color: 'border-[#CD7F32]/30 bg-[#CD7F32]/[0.05]', textColor: 'text-[#CD7F32]' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-32 pb-24">
        {/* Hero */}
        <section className="text-center max-w-[800px] mx-auto px-6 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/[0.05] px-4 py-1.5 mb-6">
            <span className="h-2 w-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs font-medium text-[#00ff88] uppercase tracking-[0.15em]">
              Live Feed
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 uppercase">
            Every Win Verified On-Chain
          </h1>
          <p className="text-[#888888] text-lg max-w-[600px] mx-auto leading-relaxed">
            Every winner is selected by Chainlink VRF and paid out by smart
            contract. Don&apos;t trust us — verify every single draw yourself.
          </p>
        </section>

        {/* Stats */}
        <section className="max-w-[900px] mx-auto px-6 mb-12">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Paid Out', value: formatUSDC(totalPaidOut) },
                { label: 'Total Winners', value: String(winners.length) },
                { label: 'Payout Rate', value: '100%' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 text-center"
                >
                  <p className="text-2xl md:text-3xl font-bold text-[#00ff88]">{s.value}</p>
                  <p className="text-xs text-[#888888] uppercase tracking-[0.1em] mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Search */}
        <section className="max-w-[900px] mx-auto px-6 mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wallet or raffle..."
            className="rounded-lg border border-white/[0.08] bg-black px-4 py-2 text-sm text-white placeholder-[#555] focus:border-[#00ff88]/30 focus:outline-none w-full sm:w-64 font-mono"
          />
        </section>

        {/* Winners List */}
        <section className="max-w-[900px] mx-auto px-6 mb-16">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] p-8 text-center">
              <span className="text-3xl block mb-2">🏆</span>
              <p className="text-sm text-[#888888]">No winners found</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] overflow-hidden">
              {filtered.map((w, i) => (
                <div
                  key={`${w.raffleId}-${w.rank}-${i}`}
                  className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-lg flex-shrink-0">
                      {w.tier === 'grand' ? '🥇' : w.tier === 'runner-up' ? '🥈' : '🍀'}
                    </span>
                    <div className="min-w-0">
                      <span className="text-sm font-mono text-white">
                        {formatAddress(w.walletAddress)}
                      </span>
                      <p className="text-xs text-[#888888] truncate">
                        Raffle #{w.raffleId.slice(0, 8)} • {w.tier}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-[#00ff88]">
                        {formatUSDC(w.prize)}
                      </p>
                      <p className="text-xs text-[#888888]">{formatTimeAgo(w.createdAt)}</p>
                    </div>
                    {w.transactionHash && (
                      <a
                        href={`https://polygonscan.com/tx/${w.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#888888] hover:text-[#00ff88] transition-colors uppercase tracking-[0.1em]"
                      >
                        Verify
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Winners Podium */}
        {topWinners.length > 0 && (
          <section className="max-w-[900px] mx-auto px-6 mb-24">
            <h2 className="text-2xl font-bold text-center mb-8">🏆 Top Winners</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topWinners.map((w, i) => {
                const config = PODIUM_CONFIG[i] ?? PODIUM_CONFIG[2];
                return (
                  <div key={`${w.raffleId}-${w.rank}`} className={`rounded-xl border p-6 text-center ${config.color}`}>
                    <span className="text-4xl block mb-3">{config.emoji}</span>
                    <p className={`text-3xl font-bold ${config.textColor} mb-1`}>
                      {formatUSDC(w.prize)}
                    </p>
                    <p className="text-sm text-white font-medium mb-1">{w.tier}</p>
                    <p className="text-xs font-mono text-[#888888]">
                      {formatAddress(w.walletAddress)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="text-center max-w-[700px] mx-auto px-6">
          <div className="rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/[0.03] p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 uppercase">Ready to Win?</h2>
            <p className="text-[#888888] mb-8 max-w-[500px] mx-auto">
              Join thousands of verified winners. Every draw is provably fair,
              every payout is automatic.
            </p>
            <Link
              href="/games/raffle"
              className="inline-flex items-center justify-center rounded-lg bg-[#00ff88] px-8 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Enter a Raffle →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
