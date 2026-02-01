'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui';
import HistoryItem from './HistoryItem';
import { useUserHistory } from '@/lib/hooks/account/useUserHistory';

interface EntryHistoryListProps {
  address?: string;
}

function HistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>📜 Entry History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-white/[0.06]">
              <div className="w-6 h-6 rounded bg-white/[0.04]" />
              <div className="flex-1">
                <div className="w-32 h-4 rounded bg-white/[0.06] mb-1" />
                <div className="w-20 h-3 rounded bg-white/[0.04]" />
              </div>
              <div className="w-16 h-4 rounded bg-white/[0.04]" />
              <div className="w-12 h-5 rounded-full bg-white/[0.04]" />
              <div className="w-16 h-4 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EntryHistoryList({ address }: EntryHistoryListProps) {
  const { history, isLoading, error } = useUserHistory(address);

  if (isLoading) {
    return <HistorySkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📜 Entry History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400 py-4 text-center">
            Failed to load history. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📜 Entry History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#888888] py-8 text-center">
            No entry history yet. Enter a raffle to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📜 Entry History</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="py-3 px-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                Raffle
              </th>
              <th className="py-3 px-4 text-center text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                Entries
              </th>
              <th className="py-3 px-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                Amount
              </th>
              <th className="py-3 px-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                Result
              </th>
              <th className="py-3 px-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                Prize
              </th>
              <th className="py-3 px-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                Date
              </th>
              <th className="py-3 px-4 text-left text-[11px] font-medium uppercase tracking-[0.1em] text-[#888888]">
                TX
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} />
            ))}
          </tbody>
        </table>

        {/* Entry Count */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06]">
          <p className="text-xs text-[#888888]">
            Showing {history.length} entries
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
