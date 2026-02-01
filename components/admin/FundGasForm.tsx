'use client';

// ============================================================================
// Operator Wallet — Fund Gas Form
// ============================================================================

import { useState } from 'react';

export default function FundGasForm() {
  const [amount, setAmount] = useState('');

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <h3 className="text-sm font-semibold text-white">⛽ Fund Gas</h3>

      <div className="mt-4 space-y-4">
        {/* Amount */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Amount
          </label>
          <div className="flex overflow-hidden rounded-lg border border-white/[0.06] bg-[#0a0a0a]">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-[#555] focus:outline-none"
            />
            <span className="flex items-center border-l border-white/[0.06] bg-[#1a1a1a] px-3 text-xs font-semibold text-[#888]">
              MATIC
            </span>
          </div>
        </div>

        {/* Source (disabled) */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Source
          </label>
          <input
            type="text"
            disabled
            value="Connect external wallet"
            className="w-full rounded-lg border border-white/[0.06] bg-[#1a1a1a] px-3 py-2.5 text-sm text-[#555] cursor-not-allowed"
          />
        </div>

        {/* Balance */}
        <p className="text-[12px] font-medium text-[#888]">
          Current balance: 142.5 MATIC
        </p>

        {/* Submit */}
        <button className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.04]">
          Connect Wallet to Fund
        </button>
      </div>
    </div>
  );
}
