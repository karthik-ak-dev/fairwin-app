'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import { apiClient } from '@/lib/api/client';
import { formatUSDC, formatAddress, formatTimeAgo, formatDate } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';
import type { RaffleItem, WinnerItem } from '@/lib/db/models';

interface VerificationResult {
  raffle: RaffleItem;
  winners: WinnerItem[];
}

export default function VerifyPage() {
  const [searchValue, setSearchValue] = useState('');
  const [queryId, setQueryId] = useState<string | null>(null);

  const { data, isLoading: isSearching, error } = useQuery({
    queryKey: ['verify', queryId],
    queryFn: async () => {
      const res = await apiClient.get<VerificationResult>(`/raffles/${queryId}`);
      return res;
    },
    enabled: !!queryId,
    staleTime: 60_000,
    retry: false,
  });

  // Fetch recent winners for bottom section
  const { data: recentData } = useQuery({
    queryKey: ['recent-winners-verify'],
    queryFn: () =>
      apiClient.get<{ winners: WinnerItem[] }>('/admin/winners', { limit: '5' }),
    staleTime: 30_000,
  });

  const recentWinners: WinnerItem[] = recentData?.winners ?? [];

  const handleSearch = () => {
    if (!searchValue.trim()) return;
    setQueryId(searchValue.trim());
  };

  const raffle = data?.raffle;
  const winners = data?.winners ?? [];
  const showResult = !!raffle && !isSearching;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="pt-32 pb-24">
        {/* Hero */}
        <section className="text-center max-w-[700px] mx-auto px-6 mb-16">
          <div className="w-16 h-16 rounded-full bg-[#00ff88]/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🔍</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Verify Transaction
          </h1>
          <p className="text-[#888888] text-lg max-w-[500px] mx-auto leading-relaxed">
            Look up any raffle draw to verify its fairness. Every winner is
            selected using Chainlink VRF with a cryptographic proof you can
            independently verify.
          </p>
        </section>

        {/* Search */}
        <section className="max-w-[700px] mx-auto px-6 mb-16">
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
            <label className="block text-sm font-medium text-[#888888] mb-3 uppercase tracking-[0.1em]">
              Raffle ID or Transaction Hash
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter raffle ID or tx hash..."
                className="flex-1 rounded-lg border border-white/[0.08] bg-black px-4 py-3 text-sm font-mono text-white placeholder-[#555] focus:border-[#00ff88]/30 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/20 transition-colors"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchValue.trim()}
                className="rounded-lg bg-[#00ff88] px-6 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && queryId && (
          <section className="max-w-[700px] mx-auto px-6 mb-16">
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-6 text-center">
              <p className="text-red-400 font-semibold">Raffle not found</p>
              <p className="text-sm text-[#888888] mt-1">
                Could not find a raffle matching &quot;{queryId}&quot;
              </p>
            </div>
          </section>
        )}

        {/* Result */}
        {showResult && raffle && (
          <section className="max-w-[700px] mx-auto px-6 mb-16 space-y-6">
            {/* Verified Badge */}
            <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.05] p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="w-6 h-6 rounded-full bg-[#00ff88] flex items-center justify-center text-black font-bold text-xs">
                  ✓
                </span>
                <span className="text-[#00ff88] font-bold text-lg uppercase tracking-[0.1em]">
                  Verified
                </span>
              </div>
              <p className="text-[#888888] text-sm">
                This draw has been cryptographically verified using Chainlink VRF.
              </p>
            </div>

            {/* Raffle Info */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
              <h3 className="text-xs font-medium text-[#888888] uppercase tracking-[0.15em] mb-4">
                Raffle Information
              </h3>
              <div className="space-y-4">
                <InfoRow label="Raffle" value={raffle.title} />
                <InfoRow label="Type" value={raffle.type} />
                <InfoRow label="Prize Pool" value={formatUSDC(raffle.prizePool)} accent />
                <InfoRow label="Winner Payout" value={formatUSDC(raffle.winnerPayout)} accent />
                <InfoRow label="Total Entries" value={String(raffle.totalEntries)} />
                <InfoRow label="Participants" value={String(raffle.totalParticipants)} />
                <InfoRow label="Start" value={formatDate(raffle.startTime)} />
                <InfoRow label="End" value={formatDate(raffle.endTime)} />
                {raffle.transactionHash && (
                  <div className="flex justify-between items-center py-2 border-t border-white/[0.05]">
                    <span className="text-sm text-[#888888]">TX Hash</span>
                    <a
                      href={`https://polygonscan.com/tx/${raffle.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-[#00ff88] hover:underline"
                    >
                      {formatAddress(raffle.transactionHash, 8, 6)} ↗
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Winners */}
            {winners.length > 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
                <h3 className="text-xs font-medium text-[#888888] uppercase tracking-[0.15em] mb-4">
                  Winners
                </h3>
                <div className="space-y-3">
                  {winners.map((w, i) => (
                    <div key={`${w.raffleId}-${w.rank}`} className="flex items-center justify-between py-2 border-t border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🍀'}</span>
                        <span className="text-sm font-mono text-white">{formatAddress(w.walletAddress)}</span>
                        <span className="text-xs text-[#888888]">{w.tier}</span>
                      </div>
                      <span className="text-sm font-bold text-[#00ff88]">{formatUSDC(w.prize)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VRF Proof */}
            {raffle.vrfRequestId && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
                <h3 className="text-xs font-medium text-[#888888] uppercase tracking-[0.15em] mb-4">
                  VRF Proof
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="block text-xs text-[#888888] mb-1">Request ID</span>
                    <p className="text-sm font-mono text-white bg-black/50 rounded-lg p-3 break-all border border-white/[0.05]">
                      {raffle.vrfRequestId}
                    </p>
                  </div>
                  {raffle.vrfRandomWord && (
                    <div>
                      <span className="block text-xs text-[#888888] mb-1">Random Word</span>
                      <p className="text-sm font-mono text-white bg-black/50 rounded-lg p-3 break-all border border-white/[0.05]">
                        {raffle.vrfRandomWord}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* External Links */}
            <div className="flex flex-col sm:flex-row gap-3">
              {raffle.transactionHash && (
                <a
                  href={`https://polygonscan.com/tx/${raffle.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white hover:border-white/20 transition-colors"
                >
                  <span>🔗</span> View on Polygonscan
                </a>
              )}
              <a
                href="https://vrf.chain.link"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white hover:border-white/20 transition-colors"
              >
                <span>⛓️</span> Chainlink VRF Explorer
              </a>
            </div>
          </section>
        )}

        {/* Recent Verifications */}
        <section className="max-w-[700px] mx-auto px-6">
          <h2 className="text-xl font-bold mb-6">Recent Verifications</h2>
          {recentWinners.length === 0 ? (
            <p className="text-sm text-[#888888] text-center py-8">No recent verifications</p>
          ) : (
            <div className="space-y-0">
              {recentWinners.map((w, i) => (
                <div
                  key={`${w.raffleId}-${w.rank}-${i}`}
                  className="flex items-center justify-between py-4 border-t border-white/[0.08] last:border-b gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-full bg-[#00ff88]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00ff88] text-xs font-bold">✓</span>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        Raffle #{w.raffleId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-[#888888] font-mono">
                        {formatAddress(w.walletAddress)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-[#00ff88]">
                      {formatUSDC(w.prize)}
                    </p>
                    <p className="text-xs text-[#888888]">{formatTimeAgo(w.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              href="/winners"
              className="text-sm text-[#888888] hover:text-white transition-colors"
            >
              View All Winners →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  accent = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-t border-white/[0.05]">
      <span className="text-sm text-[#888888]">{label}</span>
      <span
        className={`text-sm ${mono ? 'font-mono' : ''} ${
          accent ? 'text-[#00ff88] font-semibold' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
