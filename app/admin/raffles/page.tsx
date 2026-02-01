'use client';

// ============================================================================
// Admin — Raffles List Page
// ============================================================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAdminRaffles } from '@/lib/hooks/admin/useAdminRaffles';
import { useTriggerDraw } from '@/lib/hooks/admin/useTriggerDraw';
import { formatUSDC, formatNumber, formatTime } from '@/shared/utils/format';

// ---------------------------------------------------------------------------
// Filter tabs
// ---------------------------------------------------------------------------
const FILTER_KEYS = ['all', 'active', 'ending', 'drawing', 'ended', 'scheduled'] as const;
const FILTER_LABELS: Record<string, string> = {
  all: 'All',
  active: 'Active',
  ending: 'Ending Soon',
  drawing: 'Drawing',
  ended: 'Ended',
  scheduled: 'Scheduled',
};

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20',
    ending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    drawing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ended: 'bg-white/5 text-[#666] border-white/10',
    scheduled: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const label = FILTER_LABELS[status] || status;
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${map[status] ?? map.ended}`}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function TableSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
      <div className="p-4 space-y-3 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.04]">
            <div className="w-28 h-4 rounded bg-white/[0.06]" />
            <div className="w-16 h-5 rounded-full bg-white/[0.04]" />
            <div className="flex-1" />
            <div className="w-16 h-4 rounded bg-white/[0.04]" />
            <div className="w-12 h-4 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RafflesListPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { raffles, isLoading, error } = useAdminRaffles({ filter: activeFilter });
  const { trigger, isTriggering } = useTriggerDraw();

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return raffles;
    const q = search.toLowerCase();
    return raffles.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [raffles, search]);

  // Compute counts by state
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: raffles.length };
    for (const r of raffles) {
      c[r.state] = (c[r.state] || 0) + 1;
    }
    return c;
  }, [raffles]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎟️ Raffles</h1>
          <p className="text-sm text-[#888] mt-1">Manage all platform raffles</p>
        </div>
        <Link
          href="/admin/raffles/create"
          className="inline-flex items-center gap-2 rounded-lg bg-[#00ff88] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#00ff88]/90 transition-colors"
        >
          + Create Raffle
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-colors ${
              activeFilter === key
                ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20'
                : 'bg-transparent text-[#888] border-white/[0.08] hover:text-white hover:border-white/20'
            }`}
          >
            {FILTER_LABELS[key]}{' '}
            <span className={activeFilter === key ? 'text-[#00ff88]/70' : 'text-[#555]'}>
              ({counts[key] || 0})
            </span>
          </button>
        ))}

        <div className="ml-auto">
          <input
            type="text"
            placeholder="Search raffles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-white placeholder:text-[#555] px-3 py-1.5 w-56 focus:outline-none focus:border-[#00ff88]/40"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.05] text-center">
          <p className="text-sm text-red-400">Failed to load raffles</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && <TableSkeleton />}

      {/* Table */}
      {!isLoading && !error && (
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-[#666]">
                  <th className="text-left px-5 py-3 font-medium">Raffle</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Pool</th>
                  <th className="text-right px-4 py-3 font-medium">Entries</th>
                  <th className="text-right px-4 py-3 font-medium">Time</th>
                  <th className="text-right px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-[#888]">
                      No raffles found
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const endTime = new Date(r.endTime).getTime();
                    const remainingSec = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
                    const isActive = r.state === 'active' || r.state === 'ending';
                    const timeDisplay = isActive
                      ? `${formatTime(remainingSec)} left`
                      : r.state === 'ended'
                      ? 'Ended'
                      : r.state;

                    return (
                      <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3">
                          <span className="text-white font-medium">{r.title}</span>
                          <span className="text-[#666] ml-1.5 text-xs">#{r.raffleNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.state} />
                        </td>
                        <td className="px-4 py-3 text-right text-[#00ff88] font-semibold">
                          {formatUSDC(r.prizePool)}
                        </td>
                        <td className="px-4 py-3 text-right text-[#ccc]">{formatNumber(r.totalEntries)}</td>
                        <td className="px-4 py-3 text-right text-[#888] text-xs">{timeDisplay}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/admin/raffles/${r.id}`}
                              className="text-xs text-[#00ff88] hover:underline"
                            >
                              View
                            </Link>
                            {isActive && (
                              <button
                                onClick={() => trigger(r.id)}
                                disabled={isTriggering}
                                className="text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                              >
                                Trigger Draw
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Count */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
            <p className="text-xs text-[#666]">
              Showing {filtered.length} of {raffles.length} raffles
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
