'use client';

// ============================================================================
// Admin Raffle Detail — Entry Distribution (accepts props)
// ============================================================================

import { Skeleton } from '@/shared/components/ui';
import type { EntryItem } from '@/lib/db/models';

interface EntryDistributionProps {
  entries?: EntryItem[];
  isLoading?: boolean;
}

export default function EntryDistribution({ entries = [], isLoading }: EntryDistributionProps) {
  if (isLoading) {
    return <Skeleton className="h-[160px] rounded-xl" />;
  }

  // Calculate distribution from real entries
  const distribution = { single: 0, low: 0, mid: 0, high: 0 };
  const walletMap = new Map<string, number>();

  for (const e of entries) {
    walletMap.set(e.walletAddress, (walletMap.get(e.walletAddress) ?? 0) + e.numEntries);
  }

  for (const total of Array.from(walletMap.values())) {
    if (total === 1) distribution.single++;
    else if (total <= 5) distribution.low++;
    else if (total <= 10) distribution.mid++;
    else distribution.high++;
  }

  const buckets = [
    { range: '1 entry', count: distribution.single },
    { range: '2-5 entries', count: distribution.low },
    { range: '6-10 entries', count: distribution.mid },
    { range: '10+ entries', count: distribution.high },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">Entry Distribution</h3>
      <div className="grid grid-cols-4 gap-3">
        {buckets.map((b) => (
          <div key={b.range} className="rounded-lg bg-[#1a1a1a] px-3 py-4 text-center">
            <p className="text-[12px] text-[#888]">{b.range}</p>
            <p className="mt-1 text-[24px] font-bold text-white">{b.count}</p>
            <p className="text-[12px] text-[#555]">users</p>
          </div>
        ))}
      </div>
    </div>
  );
}
