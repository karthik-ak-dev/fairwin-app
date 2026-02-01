'use client';

import { useState } from 'react';
import { formatUSDC, formatTimeAgo } from '@/shared/utils/format';
import { useRaffleParticipants } from '@/lib/hooks/raffle/useRaffleParticipants';

interface ParticipantsListProps {
  raffleId: string;
}

function ParticipantsSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="w-32 h-5 rounded bg-white/[0.06]" />
        <div className="w-24 h-4 rounded bg-white/[0.04]" />
      </div>
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-white/[0.04]">
            <div className="w-28 h-4 rounded bg-white/[0.04]" />
            <div className="w-12 h-4 rounded bg-white/[0.04]" />
            <div className="w-16 h-4 rounded bg-white/[0.04]" />
            <div className="w-14 h-3 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ParticipantsList({ raffleId }: ParticipantsListProps) {
  const { participants, isLoading, error } = useRaffleParticipants(raffleId);
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return <ParticipantsSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-6 text-center">
        <p className="text-sm text-red-400">Failed to load participants</p>
      </div>
    );
  }

  const entries = showAll ? participants : participants.slice(0, 10);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-white">Recent Entries</h3>
        <span className="text-xs text-[#888888]">
          {participants.length} participants
        </span>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-3xl block mb-2">🎟️</span>
          <p className="text-sm text-[#888888]">No entries yet. Be the first!</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-[11px] text-[#888888] font-medium uppercase tracking-wider pb-3">
                    Address
                  </th>
                  <th className="text-center text-[11px] text-[#888888] font-medium uppercase tracking-wider pb-3">
                    Entries
                  </th>
                  <th className="text-right text-[11px] text-[#888888] font-medium uppercase tracking-wider pb-3">
                    Total
                  </th>
                  <th className="text-right text-[11px] text-[#888888] font-medium uppercase tracking-wider pb-3">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.walletAddress}
                    className="border-b border-white/[0.03] last:border-b-0"
                  >
                    <td className="py-3 text-sm font-mono text-white">
                      {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                    </td>
                    <td className="py-3 text-sm text-center">
                      <span className="text-[#00ff88] font-semibold">
                        {entry.numEntries}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-right text-white">
                      {formatUSDC(entry.totalPaid)}
                    </td>
                    <td className="py-3 text-xs text-right text-[#888888]">
                      {formatTimeAgo(entry.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* View All */}
          {participants.length > 10 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-4 py-3 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-[#888888] hover:text-white hover:border-white/[0.15] transition-all"
            >
              View All {participants.length} Participants
            </button>
          )}
        </>
      )}
    </div>
  );
}
