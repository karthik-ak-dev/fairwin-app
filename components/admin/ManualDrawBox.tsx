// ============================================================================
// Admin Raffle Detail — Manual Draw Box
// ============================================================================

export default function ManualDrawBox() {
  return (
    <div className="rounded-xl border border-orange-500/30 bg-[#111111] p-5">
      <h3 className="text-sm font-semibold text-white">⚡ Manual Draw</h3>
      <p className="mt-1 text-[13px] text-[#888]">
        Override automatic draw and trigger manually
      </p>

      <button className="mt-4 w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600">
        Trigger Draw Now
      </button>

      <p className="mt-3 text-center text-[11px] text-orange-400/70">
        This action cannot be undone
      </p>
    </div>
  );
}
