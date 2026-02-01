'use client';

// ============================================================================
// Admin — Create Raffle Page
// ============================================================================

import Link from 'next/link';
import CreateRaffleForm from '@/components/admin/CreateRaffleForm';

export default function CreateRafflePage() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/raffles"
        className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-white transition-colors"
      >
        ← Back to Raffles
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">➕ Create New Raffle</h1>
        <p className="text-sm text-[#888] mt-1">Configure and launch a new raffle</p>
      </div>

      {/* Form + Preview */}
      <CreateRaffleForm />
    </div>
  );
}
