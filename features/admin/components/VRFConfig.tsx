'use client';

// ============================================================================
// Settings — Chainlink VRF Configuration
// ============================================================================

import { useState } from 'react';

const VRF_COORDINATOR = '0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed';
const KEY_HASH = '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f';

export default function VRFConfig() {
  const [subscriptionId, setSubscriptionId] = useState('1234');
  const [gasLimit, setGasLimit] = useState('500000');
  const [confirmations, setConfirmations] = useState('3');

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-6">
      <h3 className="text-base font-semibold text-white">🎲 Chainlink VRF</h3>

      {/* Status */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#00ff88]/[0.06] border border-[#00ff88]/20 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-[#00ff88]" />
        <p className="text-sm font-medium text-[#00ff88]">
          VRF Configured • 48.2 LINK available
        </p>
      </div>

      {/* VRF Coordinator */}
      <div className="mt-5">
        <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
          VRF Coordinator
        </label>
        <input
          type="text"
          disabled
          value={VRF_COORDINATOR}
          className="w-full rounded-lg border border-white/[0.06] bg-[#1a1a1a] px-3 py-2.5 font-mono text-sm text-[#ccc] cursor-not-allowed"
        />
      </div>

      {/* Subscription + Key Hash */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Subscription ID
          </label>
          <input
            type="text"
            value={subscriptionId}
            onChange={(e) => setSubscriptionId(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white focus:border-[#00ff88]/30 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Key Hash
          </label>
          <input
            type="text"
            disabled
            value={`${KEY_HASH.slice(0, 16)}...${KEY_HASH.slice(-8)}`}
            className="w-full rounded-lg border border-white/[0.06] bg-[#1a1a1a] px-3 py-2.5 font-mono text-sm text-[#ccc] cursor-not-allowed"
          />
        </div>
      </div>

      {/* Gas Limit + Confirmations */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Callback Gas Limit
          </label>
          <input
            type="text"
            value={gasLimit}
            onChange={(e) => setGasLimit(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white focus:border-[#00ff88]/30 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Request Confirmations
          </label>
          <input
            type="text"
            value={confirmations}
            onChange={(e) => setConfirmations(e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white focus:border-[#00ff88]/30 focus:outline-none focus:ring-1 focus:ring-[#00ff88]/20"
          />
        </div>
      </div>

      {/* Save */}
      <button className="mt-5 rounded-lg bg-[#00ff88] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-[#00e67a]">
        Save VRF Settings
      </button>
    </div>
  );
}
