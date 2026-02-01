'use client';

// ============================================================================
// Admin Dashboard — Active Raffles Table
// ============================================================================

import Link from 'next/link';
import { useAdminRaffles } from '@/lib/hooks/admin/useAdminRaffles';
import { useTriggerDraw } from '@/lib/hooks/admin/useTriggerDraw';
import { formatUSDC, formatNumber, formatTime } from '@/shared/utils/format';

function StatusBadge({ status }: { status: string }) {
  const isEnding = status === 'ending';
  const colors = isEnding
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20';
  const label = isEnding ? 'Ending Soon' : status === 'active' ? 'Active' : status;
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${colors}`}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="w-28 h-4 rounded bg-white/[0.06]" />
      </div>
      <div className="p-4 space-y-3 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.04]">
            <div className="w-24 h-4 rounded bg-white/[0.06]" />
            <div className="w-16 h-5 rounded-full bg-white/[0.04]" />
            <div className="flex-1" />
            <div className="w-16 h-4 rounded bg-white/[0.04]" />
            <div className="w-12 h-4 rounded bg-white/[0.04]" />
            <div className="w-14 h-4 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActiveRafflesTable() {
  const { raffles, isLoading, error } = useAdminRaffles({ filter: 'all' });
  const { trigger, isTriggering } = useTriggerDraw();

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.05] p-6 text-center">
        <p className="text-sm text-red-400">Failed to load raffles</p>
      </div>
    );
  }

  // Show active/ending raffles
  const activeRaffles = raffles.filter(
    (r) => r.state === 'active' || r.state === 'ending'
  );

  if (activeRaffles.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-8 text-center">
        <span className="text-2xl block mb-2">🎯</span>
        <p className="text-sm text-[#888]">No active raffles</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Active Raffles</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] uppercase tracking-wider text-[#666]">
              <th className="text-left px-5 py-3 font-medium">Raffle</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Pool</th>
              <th className="text-right px-4 py-3 font-medium">Entries</th>
              <th className="text-right px-4 py-3 font-medium">Time Left</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeRaffles.map((r) => {
              const endTime = new Date(r.endTime).getTime();
              const now = Date.now();
              const remainingSec = Math.max(0, Math.floor((endTime - now) / 1000));

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
                  <td className="px-4 py-3 text-right text-[#ccc]">{formatTime(remainingSec)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/raffles/${r.id}`}
                        className="text-xs text-[#00ff88] hover:underline"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => trigger(r.id)}
                        disabled={isTriggering}
                        className="text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                      >
                        Trigger Draw
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
