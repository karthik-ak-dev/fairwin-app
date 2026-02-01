'use client';

// ============================================================================
// Admin — Operator Wallet Page (real data)
// ============================================================================

import { useAdmin } from '@/shared/hooks/useAdmin';
import WalletHero from '@/components/admin/WalletHero';
import WithdrawForm from '@/components/admin/WithdrawForm';
import FundGasForm from '@/components/admin/FundGasForm';
import { Skeleton } from '@/shared/components/ui';

export default function WalletPage() {
  const { isAdmin, isConnected, address } = useAdmin();

  if (!isConnected || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-10 rounded-2xl border border-red-500/20 bg-red-500/[0.05] max-w-md w-full">
          <span className="text-[48px] block mb-4">🚫</span>
          <h2 className="text-xl font-bold text-red-400 mb-2">Unauthorized</h2>
          <p className="text-sm text-[#888888]">Connect an admin wallet to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">💰 Operator Wallet</h1>
      <WalletHero address={address!} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WithdrawForm />
        <FundGasForm />
      </div>
    </div>
  );
}
