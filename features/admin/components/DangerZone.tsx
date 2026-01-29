'use client';

// ============================================================================
// Settings — Danger Zone
// ============================================================================

import { useState } from 'react';

export default function DangerZone() {
  const [paused, setPaused] = useState(false);

  return (
    <div className="rounded-xl border border-red-500/30 bg-[#111111] p-6">
      <h3 className="text-base font-semibold text-red-400">
        ⚠️ Danger Zone
      </h3>

      {/* Pause contract toggle */}
      <div className="mt-5 flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#0a0a0a] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Pause Contract</p>
          <p className="mt-0.5 text-[12px] text-[#888]">
            Temporarily disable all contract operations
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className={`relative h-6 w-12 rounded-full transition-colors ${
            paused ? 'bg-red-500' : 'bg-[#333]'
          }`}
          aria-label="Toggle pause contract"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              paused ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Separator */}
      <hr className="my-5 border-white/[0.06]" />

      {/* Emergency actions */}
      <div>
        <p className="text-sm font-semibold text-white">Emergency Actions</p>
        <p className="mt-1 text-[12px] text-[#888]">
          These actions are irreversible and should only be used in emergencies.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button className="rounded-lg border border-red-500 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10">
            Cancel All Active Raffles
          </button>
          <button className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600">
            Emergency Pause
          </button>
        </div>

        <p className="mt-3 text-[11px] text-red-400/60">
          ⚠️ Emergency actions cannot be undone. Use with extreme caution.
        </p>
      </div>
    </div>
  );
}
