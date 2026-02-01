'use client';

// ============================================================================
// Admin — Settings Page
// ============================================================================

import ContractConfig from '@/components/admin/ContractConfig';
import PoolLimits from '@/components/admin/PoolLimits';
import OperationsConfig from '@/components/admin/OperationsConfig';
import DangerZone from '@/components/admin/DangerZone';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>

      {/* Sections */}
      <ContractConfig />
      <PoolLimits />
      <OperationsConfig />
      <DangerZone />
    </div>
  );
}
