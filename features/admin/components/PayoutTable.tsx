'use client';

// ============================================================================
// Winners & Payouts — Payout Table (real data)
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { useAdmin } from '@/shared/hooks/useAdmin';
import { getAdminWinners } from '@/features/admin/api';
import { formatUSDC, formatAddress, formatTimeAgo } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';
import type { PayoutItem } from '@/lib/db/models';

const STATUS_STYLES: Record<string, string> = {
  paid: 'bg-[#00ff88]/10 text-[#00ff88]',
  pending: 'bg-orange-500/10 text-orange-400',
  failed: 'bg-red-500/10 text-red-400',
};

export default function PayoutTable() {
  const { address, isAdmin } = useAdmin();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-winners', address],
    queryFn: () => getAdminWinners(address!),
    enabled: !!address && isAdmin,
    staleTime: 10_000,
  });

  const payouts: PayoutItem[] = data?.payouts ?? [];

  if (isLoading) {
    return <Skeleton className="h-[400px] rounded-xl" />;
  }

  if (payouts.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-8 text-center">
        <span className="text-2xl block mb-2">🏆</span>
        <p className="text-sm text-[#888]">No payouts recorded yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-wider text-[#555]">
              <th className="px-5 py-3 text-left">Raffle</th>
              <th className="px-5 py-3 text-left">Winner</th>
              <th className="px-5 py-3 text-left">Amount</th>
              <th className="px-5 py-3 text-left">Time</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-left">Transaction</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p, i) => (
              <tr
                key={`${p.payoutId}-${i}`}
                className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-5 py-3 text-white">
                  🎲 <span className="text-[#888] font-mono text-xs">{p.raffleId.slice(0, 8)}</span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-[#ccc]">
                  {formatAddress(p.walletAddress)}
                </td>
                <td className="px-5 py-3 font-semibold text-[#00ff88]">
                  {formatUSDC(p.amount)}
                </td>
                <td className="px-5 py-3 text-[#888]">
                  {formatTimeAgo(p.createdAt)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                      STATUS_STYLES[p.status] ?? ''
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {p.transactionHash ? (
                    <a
                      href={`https://polygonscan.com/tx/${p.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-[#00ff88] hover:underline"
                    >
                      View
                    </a>
                  ) : (
                    <span className="text-xs text-[#555]">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
        <p className="text-xs text-[#888]">
          Showing {payouts.length} payouts
        </p>
      </div>
    </div>
  );
}
