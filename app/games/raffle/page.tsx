'use client';

import { useState, useMemo } from 'react';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import FilterTabs from '@/features/raffle/components/FilterTabs';
import RaffleList from '@/features/raffle/components/RaffleList';
import type { RaffleType } from '@/features/raffle/types';
import { useRaffles } from '@/features/raffle/hooks/useRaffles';
import { formatUSDC, formatNumber } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';

export default function RaffleHubPage() {
  const [activeFilter, setActiveFilter] = useState<RaffleType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filter = activeFilter !== 'all' ? { type: activeFilter } : undefined;
  const { raffles, isLoading, error } = useRaffles(filter);

  const filteredRaffles = useMemo(() => {
    if (!searchQuery.trim()) return raffles;
    const q = searchQuery.toLowerCase();
    return raffles.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [raffles, searchQuery]);

  const activeRaffleCount = raffles.filter(
    (r) => r.state === 'active' || r.state === 'ending'
  ).length;
  const totalPrizePool = raffles.reduce((sum, r) => sum + r.prizePool, 0);
  const totalEntries = raffles.reduce((sum, r) => sum + r.totalEntries, 0);
  const totalPlayers = raffles.reduce((sum, r) => sum + r.totalParticipants, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-24 pb-16">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-white mb-2">🎟️ Raffle Hub</h1>
            <p className="text-[#888888] text-sm max-w-lg">
              Browse active raffles, enter for your chance to win, and track
              results — all provably fair, all on-chain.
            </p>
          </div>

          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[100px] rounded-xl" />
              ))}
            </div>
          )}

          {!isLoading && !error && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Active Raffles', value: String(activeRaffleCount), icon: '🎯' },
                { label: 'Total Prize Pool', value: formatUSDC(totalPrizePool), icon: '💰' },
                { label: 'Total Entries', value: formatNumber(totalEntries), icon: '🎟️' },
                { label: 'Unique Players', value: formatNumber(totalPlayers), icon: '👥' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] p-4 text-center"
                >
                  <span className="text-xl mb-1 block">{stat.icon}</span>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-[#888888] uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-10 p-6 rounded-xl border border-red-500/20 bg-red-500/[0.05] text-center">
              <span className="text-3xl block mb-2">⚠️</span>
              <p className="text-red-400 font-semibold mb-1">Failed to load raffles</p>
              <p className="text-sm text-[#888888]">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          )}

          <FilterTabs
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <RaffleList raffles={filteredRaffles} loading={isLoading} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
