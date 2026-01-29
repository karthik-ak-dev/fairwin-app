import { formatUSDC, formatDate } from '@/shared/utils/format';
import { RAFFLE_TYPES } from '@/features/raffle/constants';
import type { Raffle } from '@/features/raffle/types';

interface RaffleInfoProps {
  raffle: Raffle;
}

export default function RaffleInfo({ raffle }: RaffleInfoProps) {
  const typeConfig = RAFFLE_TYPES.find((t) => t.value === raffle.type);

  const rows = [
    {
      label: 'Raffle ID',
      value: raffle.id,
      mono: true,
    },
    {
      label: 'Type',
      value: `${typeConfig?.icon ?? ''} ${typeConfig?.label ?? raffle.type}`,
    },
    {
      label: 'Entry Price',
      value: `${formatUSDC(raffle.entryPrice)} USDC`,
    },
    {
      label: 'Max / User',
      value: `${raffle.maxEntriesPerUser} entries`,
    },
    {
      label: 'Started',
      value: formatDate(raffle.startTime),
    },
    {
      label: 'Ends',
      value: formatDate(raffle.endTime),
    },
    {
      label: 'Contract',
      value: raffle.contractAddress,
      mono: true,
      link: `https://polygonscan.com/address/${raffle.contractAddress}`,
    },
  ];

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6">
      <h3 className="text-lg font-bold text-white mb-5">Raffle Details</h3>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-b-0"
          >
            <span className="text-sm text-[#888888]">{row.label}</span>
            {row.link ? (
              <a
                href={row.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm text-[#00ff88] hover:underline ${
                  row.mono ? 'font-mono' : ''
                }`}
              >
                {row.value} ↗
              </a>
            ) : (
              <span
                className={`text-sm text-white ${
                  row.mono ? 'font-mono text-xs' : ''
                }`}
              >
                {row.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
