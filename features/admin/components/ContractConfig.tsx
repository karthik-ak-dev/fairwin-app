// ============================================================================
// Settings — Contract Configuration
// ============================================================================

const CONTRACT = '0x4B3a7c8E91fD2e6A0b5C84d3F1a9E7c2D8b6F0e9';

export default function ContractConfig() {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-6">
      <h3 className="text-base font-semibold text-white">
        📋 Contract Configuration
      </h3>

      {/* Status */}
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#00ff88]/[0.06] border border-[#00ff88]/20 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-[#00ff88]" />
        <p className="text-sm font-medium text-[#00ff88]">
          Contract Active • All systems operational
        </p>
      </div>

      {/* Contract address */}
      <div className="mt-5">
        <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
          Contract Address
        </label>
        <input
          type="text"
          disabled
          value={CONTRACT}
          className="w-full rounded-lg border border-white/[0.06] bg-[#1a1a1a] px-3 py-2.5 font-mono text-sm text-[#ccc] cursor-not-allowed"
        />
      </div>

      {/* Fee split */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Protocol Fee
          </label>
          <input
            type="text"
            disabled
            value="10%"
            className="w-full rounded-lg border border-white/[0.06] bg-[#1a1a1a] px-3 py-2.5 text-sm text-[#ccc] cursor-not-allowed"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-[#888]">
            Winner Share
          </label>
          <input
            type="text"
            disabled
            value="90%"
            className="w-full rounded-lg border border-white/[0.06] bg-[#1a1a1a] px-3 py-2.5 text-sm text-[#ccc] cursor-not-allowed"
          />
        </div>
      </div>

      <p className="mt-3 text-[12px] text-[#555]">
        Immutable in contract
      </p>
    </div>
  );
}
