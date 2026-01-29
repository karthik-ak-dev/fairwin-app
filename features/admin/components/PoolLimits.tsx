'use client';

// ============================================================================
// Settings — Pool Limits
// ============================================================================

import { useState } from 'react';

export default function PoolLimits() {
  const [maxDaily, setMaxDaily] = useState('5000');
  const [maxWeekly, setMaxWeekly] = useState('25000');
  const [maxSingle, setMaxSingle] = useState('500');
  const [maxPerUser, setMaxPerUser] = useState('100');

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-6">
      <h3 className="text-base font-semibold text-white">🛡️ Pool Limits</h3>

      {/* Row 1 */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Max Pool Daily
          </label>
          <div className="flex overflow-hidden rounded-lg border border-white/[0.06] bg-[#0a0a0a]">
            <input
              type="number"
              value={maxDaily}
              onChange={(e) => setMaxDaily(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none"
            />
            <span className="flex items-center border-l border-white/[0.06] bg-[#1a1a1a] px-3 text-xs font-semibold text-[#888]">
              USDC
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Max Pool Weekly
          </label>
          <div className="flex overflow-hidden rounded-lg border border-white/[0.06] bg-[#0a0a0a]">
            <input
              type="number"
              value={maxWeekly}
              onChange={(e) => setMaxWeekly(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none"
            />
            <span className="flex items-center border-l border-white/[0.06] bg-[#1a1a1a] px-3 text-xs font-semibold text-[#888]">
              USDC
            </span>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Max Single Entry
          </label>
          <div className="flex overflow-hidden rounded-lg border border-white/[0.06] bg-[#0a0a0a]">
            <input
              type="number"
              value={maxSingle}
              onChange={(e) => setMaxSingle(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white focus:outline-none"
            />
            <span className="flex items-center border-l border-white/[0.06] bg-[#1a1a1a] px-3 text-xs font-semibold text-[#888]">
              USDC
            </span>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Max Entries Per User
          </label>
          <input
            type="number"
            value={maxPerUser}
            onChange={(e) => setMaxPerUser(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Save */}
      <button className="mt-5 rounded-lg bg-[#00ff88] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#00e67a]">
        Update Limits
      </button>
    </div>
  );
}
