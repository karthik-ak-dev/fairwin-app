'use client';

import { Badge } from '@/shared/components/ui';
import { formatUSDC, formatDate } from '@/shared/utils/format';
import { getTransactionUrl } from '@/shared/utils/constants';
import type { UserEntry } from '@/features/account/types';

interface HistoryItemProps {
  entry: UserEntry;
}

const RESULT_CONFIG: Record<UserEntry['status'], { label: string; variant: 'success' | 'ended' | 'drawing' }> = {
  won: { label: 'Won', variant: 'success' },
  lost: { label: 'Lost', variant: 'ended' },
  active: { label: 'Active', variant: 'drawing' },
};

export default function HistoryItem({ entry }: HistoryItemProps) {
  const result = RESULT_CONFIG[entry.status];

  return (
    <tr className="border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors">
      {/* Raffle */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          <span className="text-base">🎰</span>
          <div>
            <p className="text-sm font-medium text-white">{entry.raffleTitle}</p>
            <p className="text-[11px] text-[#888888] font-mono">{entry.raffleId}</p>
          </div>
        </div>
      </td>

      {/* Entries */}
      <td className="py-3 px-4 text-sm text-white text-center">
        {entry.entriesCount}
      </td>

      {/* Amount */}
      <td className="py-3 px-4 text-sm text-white">
        {formatUSDC(entry.totalAmount)}
      </td>

      {/* Result */}
      <td className="py-3 px-4">
        <Badge variant={result.variant}>{result.label}</Badge>
      </td>

      {/* Prize */}
      <td className="py-3 px-4 text-sm">
        {entry.prizeWon ? (
          <span className="text-[#00ff88] font-semibold">{formatUSDC(entry.prizeWon)}</span>
        ) : (
          <span className="text-[#888888]">—</span>
        )}
      </td>

      {/* Date */}
      <td className="py-3 px-4 text-xs text-[#888888] whitespace-nowrap">
        {formatDate(entry.timestamp, { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>

      {/* TX */}
      <td className="py-3 px-4">
        <a
          href={getTransactionUrl(entry.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#888888] hover:text-[#00ff88] transition-colors font-mono"
        >
          TX ↗
        </a>
      </td>
    </tr>
  );
}
