'use client';

// ============================================================================
// Admin — Settings Page
// ============================================================================

import ContractConfig from '@/features/admin/components/ContractConfig';
import VRFConfig from '@/features/admin/components/VRFConfig';
import PoolLimits from '@/features/admin/components/PoolLimits';
import OperationsConfig from '@/features/admin/components/OperationsConfig';
import DangerZone from '@/features/admin/components/DangerZone';

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold text-white">⚙️ Settings</h1>

      {/* Sections */}
      <ContractConfig />
      <VRFConfig />
      <PoolLimits />
      <OperationsConfig />
      <DangerZone />
    </div>
  );
}
