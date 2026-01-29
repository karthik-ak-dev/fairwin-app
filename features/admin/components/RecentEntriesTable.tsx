'use client';

// ============================================================================
// Admin Raffle Detail — Recent Entries Table (accepts props)
// ============================================================================

import { formatUSDC, formatAddress, formatTimeAgo } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';
import type { EntryItem } from '@/lib/db/models';

interface RecentEntriesTableProps {
  entries?: EntryItem[];
  isLoading?: boolean;
}

export default function RecentEntriesTable({ entries = [], isLoading }: RecentEntriesTableProps) {
  if (isLoading) {
    return <Skeleton className="h-[300px] rounded-xl" />;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-8 text-center">
        <span className="text-2xl block mb-2">🎟️</span>
        <p className="text-sm text-[#888]">No entries yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <h3 className="text-sm font-semibold text-white">Recent Entries</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-[#555]">
              <th className="px-5 py-3 text-left">Address</th>
              <th className="px-5 py-3 text-left">Entries</th>
              <th className="px-5 py-3 text-left">Total</th>
              <th className="px-5 py-3 text-left">Time</th>
              <th className="px-5 py-3 text-left">TX</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.entryId}
                className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3 font-mono text-xs text-[#ccc]">
                  {formatAddress(entry.walletAddress)}
                </td>
                <td className="px-5 py-3 font-semibold text-[#00ff88]">
                  {entry.numEntries}
                </td>
                <td className="px-5 py-3 text-white">{formatUSDC(entry.totalPaid)}</td>
                <td className="px-5 py-3 text-[#888]">{formatTimeAgo(entry.createdAt)}</td>
                <td className="px-5 py-3">
                  <a
                    href={`https://polygonscan.com/tx/${entry.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[#00ff88] hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
