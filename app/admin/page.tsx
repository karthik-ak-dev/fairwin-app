'use client';

// ============================================================================
// Admin Dashboard Page
// ============================================================================

import { useAdmin } from '@/shared/hooks/useAdmin';
import { useAdminStats } from '@/features/admin/hooks/useAdminStats';
import DashboardStats from '@/features/admin/components/DashboardStats';
import ActiveRafflesTable from '@/features/admin/components/ActiveRafflesTable';
import RecentDrawsTable from '@/features/admin/components/RecentDrawsTable';
import RevenueChart from '@/features/admin/components/RevenueChart';
import ConnectButton from '@/shared/components/web3/ConnectButton';

export default function AdminDashboardPage() {
  const { isAdmin, isConnected } = useAdmin();
  const { stats, isLoading } = useAdminStats();

  // Not connected
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] max-w-md w-full">
          <span className="text-[48px] block mb-4">🔐</span>
          <h2 className="text-xl font-bold text-white mb-2">
            Admin Access Required
          </h2>
          <p className="text-sm text-[#888888] mb-6">
            Connect your admin wallet to access the dashboard.
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  // Connected but not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-10 rounded-2xl border border-red-500/20 bg-red-500/[0.05] max-w-md w-full">
          <span className="text-[48px] block mb-4">🚫</span>
          <h2 className="text-xl font-bold text-red-400 mb-2">
            Unauthorized
          </h2>
          <p className="text-sm text-[#888888]">
            Your connected wallet does not have admin privileges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">📊 Dashboard</h1>
        <p className="text-sm text-[#888] mt-1">Overview of platform activity</p>
      </div>

      {/* Stat Cards */}
      <DashboardStats stats={stats} isLoading={isLoading} />

      {/* Revenue Chart */}
      <RevenueChart />

      {/* Two-column grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ActiveRafflesTable />
        </div>
        <div className="col-span-1">
          <RecentDrawsTable />
        </div>
      </div>
    </div>
  );
}
