'use client';

// ============================================================================
// Operator Wallet — Recent Transactions (placeholder - no API yet)
// ============================================================================

import { Skeleton } from '@/shared/components/ui';

export default function WalletTransactions() {
  // Transactions will be populated when the wallet API returns tx history.
  // For now, show an empty state rather than mock data.
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111]">
      <div className="border-b border-white/[0.06] px-5 py-4">
        <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
      </div>
      <div className="p-8 text-center">
        <span className="text-2xl block mb-2">📋</span>
        <p className="text-sm text-[#888]">Transaction history will appear here</p>
        <p className="text-xs text-[#555] mt-1">Transactions are fetched from the blockchain</p>
      </div>
    </div>
  );
}
