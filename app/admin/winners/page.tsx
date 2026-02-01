'use client';

// ============================================================================
// Admin — Winners & Payouts Page (real data)
// ============================================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAdmin } from '@/shared/hooks/useAdmin';
import { getAdminWinners, getAdminStats } from '@/lib/api/admin';
import { formatUSDC, formatAddress, formatTimeAgo } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';
import type { PayoutItem } from '@/lib/db/models';

const STATUS_FILTERS = ['all', 'paid', 'pending', 'failed'] as const;

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-[#00ff88]/10 text-[#00ff88]',
  pending: 'bg-orange-500/10 text-orange-400',
  failed: 'bg-red-500/10 text-red-400',
};

export default function WinnersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const { address, isAdmin } = useAdmin();

  const { data: winnersData, isLoading: winnersLoading } = useQuery({
    queryKey: ['admin-winners', address, statusFilter],
    queryFn: () =>
      getAdminWinners(address!, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
      }),
    enabled: !!address && isAdmin,
    staleTime: 10_000,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats', address],
    queryFn: () => getAdminStats(address!),
    enabled: !!address && isAdmin,
    staleTime: 15_000,
  });

  const payouts: PayoutItem[] = winnersData?.payouts ?? [];
  const payoutStats = statsData?.stats?.payoutStats;

  const filteredPayouts = search
    ? payouts.filter(
        (p) =>
          p.walletAddress.toLowerCase().includes(search.toLowerCase()) ||
          p.raffleId.toLowerCase().includes(search.toLowerCase())
      )
    : payouts;

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-10 rounded-2xl border border-red-500/20 bg-red-500/[0.05] max-w-md w-full">
          <span className="text-[48px] block mb-4">🚫</span>
          <h2 className="text-xl font-bold text-red-400 mb-2">Unauthorized</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">🏆 Winners &amp; Payouts</h1>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Paid Out', value: formatUSDC(payoutStats?.totalPaid ?? 0), highlight: true },
            { label: 'This Month', value: formatUSDC(payoutStats?.thisMonth ?? 0) },
            { label: 'This Week', value: formatUSDC(payoutStats?.thisWeek ?? 0) },
            { label: 'Avg Payout', value: formatUSDC(payoutStats?.avgPayout ?? 0) },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border px-5 py-4 ${
                s.highlight
                  ? 'border-[#00ff88]/20 bg-[#00ff88]/[0.06]'
                  : 'border-white/[0.06] bg-[#111111]'
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">
                {s.label}
              </p>
              <p className={`mt-1 text-[28px] font-bold leading-tight ${s.highlight ? 'text-[#00ff88]' : 'text-white'}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex rounded-lg border border-white/[0.06] bg-[#111111] p-1">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                statusFilter === tab
                  ? 'bg-[#00ff88]/10 text-[#00ff88]'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search address or raffle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-white/[0.06] bg-[#111111] px-4 py-2 text-sm text-white placeholder:text-[#555] focus:border-[#00ff88]/30 focus:outline-none"
        />
      </div>

      {/* Table */}
      {winnersLoading ? (
        <Skeleton className="h-[400px] rounded-xl" />
      ) : filteredPayouts.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-8 text-center">
          <span className="text-2xl block mb-2">🏆</span>
          <p className="text-sm text-[#888]">No payouts found</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-[#111111]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-[#555]">
                  <th className="px-5 py-3 text-left">Raffle</th>
                  <th className="px-5 py-3 text-left">Winner</th>
                  <th className="px-5 py-3 text-left">Amount</th>
                  <th className="px-5 py-3 text-left">Time</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Transaction</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((p, i) => (
                  <tr
                    key={`${p.payoutId}-${i}`}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3 text-white">
                      🎲 Raffle <span className="text-[#888] font-mono text-xs">{p.raffleId.slice(0, 8)}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#ccc]">
                      {formatAddress(p.walletAddress)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-[#00ff88]">
                      {formatUSDC(p.amount)}
                    </td>
                    <td className="px-5 py-3 text-[#888]">
                      {formatTimeAgo(p.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          STATUS_STYLES[p.status] ?? ''
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {p.transactionHash ? (
                        <a
                          href={`https://polygonscan.com/tx/${p.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-[#00ff88] hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-[#555]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
            <p className="text-xs text-[#888]">
              Showing {filteredPayouts.length} payouts
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
