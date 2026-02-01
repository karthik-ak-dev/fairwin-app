// ============================================================================
// Operator Wallet — Balance Alert Bar
// ============================================================================

export default function BalanceAlert() {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#00ff88]/[0.06] border border-[#00ff88]/20 px-5 py-4">
      <span className="text-lg">✅</span>
      <div>
        <p className="text-sm font-semibold text-[#00ff88]">
          All balances healthy
        </p>
        <p className="text-[12px] text-[#888]">
          Gas and VRF funds sufficient for normal operations
        </p>
      </div>
    </div>
  );
}
