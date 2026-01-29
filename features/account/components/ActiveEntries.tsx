'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/shared/components/ui';
import { formatUSDC } from '@/shared/utils/format';
import { useCountdown } from '@/shared/hooks/useCountdown';
import { useUserEntries } from '@/features/account/hooks/useUserEntries';
import type { UserEntry } from '@/features/account/types';
import type { RaffleType } from '@/features/raffle/types';

// ─── Type badge color mapping ────────────────────────────────
const TYPE_BADGE_VARIANT: Record<RaffleType, 'live' | 'ending' | 'drawing' | 'scheduled' | 'default'> = {
  daily: 'live',
  weekly: 'drawing',
  monthly: 'scheduled',
  flash: 'ending',
  mega: 'gold' as never,
};

// ─── Countdown Display ───────────────────────────────────────
function CountdownDisplay({ endTime }: { endTime: string }) {
  const { formatted, isExpired } = useCountdown(endTime);

  if (isExpired) {
    return <span className="text-[#888888] text-xs">Ended</span>;
  }

  return <span className="text-xs font-mono text-[#f97316]">{formatted}</span>;
}

// ─── Loading Skeleton ────────────────────────────────────────
function ActiveEntriesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🎟️ Active Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-white/[0.06]">
              <div>
                <div className="w-32 h-4 rounded bg-white/[0.06] mb-2" />
                <div className="w-24 h-3 rounded bg-white/[0.04]" />
              </div>
              <div className="w-20 h-4 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Active Entry Row ────────────────────────────────────────
function ActiveEntryRow({ entry }: { entry: UserEntry }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 border-b border-white/[0.06] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-white truncate">
            {entry.raffleTitle}
          </span>
          <Badge variant={TYPE_BADGE_VARIANT[entry.raffleType] ?? 'default'} className="text-[10px] px-2 py-0">
            {entry.raffleType.charAt(0).toUpperCase() + entry.raffleType.slice(1)}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#888888]">
          <span>{entry.entriesCount} entries</span>
          <span>Paid: {formatUSDC(entry.totalAmount)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href={`/games/raffle/${entry.raffleId}`}
          className="text-xs text-[#00ff88] hover:text-[#00ff88]/80 font-medium transition-colors"
        >
          View Raffle →
        </Link>
      </div>
    </div>
  );
}

// ─── Active Entries Card ─────────────────────────────────────
interface ActiveEntriesProps {
  address?: string;
}

export default function ActiveEntries({ address }: ActiveEntriesProps) {
  const { entries, isLoading, error } = useUserEntries(address);

  if (isLoading) {
    return <ActiveEntriesSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🎟️ Active Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400 py-4 text-center">
            Failed to load entries. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter to only active entries
  const activeEntries = entries.filter((e) => e.status === 'active');

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎟️ Active Entries</CardTitle>
      </CardHeader>
      <CardContent>
        {activeEntries.length === 0 ? (
          <p className="text-sm text-[#888888] py-8 text-center">
            No active entries. Join a raffle to get started!
          </p>
        ) : (
          <div className="divide-y divide-transparent">
            {activeEntries.map((entry) => (
              <ActiveEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
