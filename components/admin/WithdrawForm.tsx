'use client';

// ============================================================================
// Operator Wallet — Withdraw Revenue Form
// ============================================================================

import { useState } from 'react';

export default function WithdrawForm() {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-5">
      <h3 className="text-sm font-semibold text-white">📤 Withdraw Revenue</h3>

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
              USDC
            </span>
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Destination Address
          </label>
          <input
            type="text"
            placeholder="0x..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2.5 text-sm font-mono text-white placeholder:text-[#555] focus:border-[#00ff88]/30 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/20"
          />
        </div>

        {/* Available */}
        <p className="text-[12px] font-medium text-[#00ff88]">
          Available: $23,450.00 USDC
        </p>

        {/* Submit */}
        <button className="w-full rounded-lg bg-[#00ff88] px-4 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#00e67a]">
          Withdraw
        </button>
      </div>
    </div>
  );
}
