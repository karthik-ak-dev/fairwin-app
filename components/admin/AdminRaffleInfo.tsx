'use client';

// ============================================================================
// Admin Raffle Detail — Info Card (accepts props)
// ============================================================================

import { formatUSDC, formatDate, formatAddress } from '@/shared/utils/format';
import { getAddressUrl } from '@/shared/utils/constants';
import type { Raffle } from '@/features/raffle/types';

interface AdminRaffleInfoProps {
  raffle?: Raffle;
}

export default function AdminRaffleInfo({ raffle }: AdminRaffleInfoProps) {
  if (!raffle) return null;

  const rows = [
    { label: 'Raffle ID', value: raffle.id, mono: true },
    { label: 'Type', value: raffle.type },
    { label: 'Entry Price', value: `${formatUSDC(raffle.entryPrice)} USDC` },
    { label: 'Max / User', value: String(raffle.maxEntriesPerUser) },
    { label: 'Started', value: formatDate(raffle.startTime) },
    { label: 'Ends', value: formatDate(raffle.endTime) },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <h3 className="mb-4 text-sm font-semibold text-white">Raffle Info</h3>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-[13px] text-[#888]">{r.label}</span>
            <span className={`text-[13px] font-medium text-white ${r.mono ? 'font-mono' : ''}`}>
              {r.value}
            </span>
          </div>
        ))}

        {raffle.contractAddress && (
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-[#888]">Contract</span>
            <span className="flex items-center gap-2">
              <span className="text-[13px] font-mono font-medium text-white">
                {formatAddress(raffle.contractAddress)}
              </span>
              <a
                href={getAddressUrl(raffle.contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-[#00ff88] hover:underline"
              >
                Polygonscan ↗
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
