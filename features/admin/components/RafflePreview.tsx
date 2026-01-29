// ============================================================================
// Admin — Live Raffle Preview Card
// ============================================================================

interface RafflePreviewProps {
  type: string;
  entryPrice: number;
  duration: number;
  durationUnit: string;
  maxEntriesPerUser: number;
  entryCap: number | null;
}

export default function RafflePreview({
  type,
  entryPrice,
  duration,
  durationUnit,
  maxEntriesPerUser,
  entryCap,
}: RafflePreviewProps) {
  const typeLabels: Record<string, string> = {
    daily: 'Daily Raffle',
    weekly: 'Weekly Mega',
    monthly: 'Monthly Grand',
  };

  const title = typeLabels[type] || 'New Raffle';
  const durationLabel = `${duration} ${durationUnit}`;
  const estimatedPool = entryPrice * (entryCap || 500);
  const winnerGets = estimatedPool * 0.9;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Live Preview</h3>
      </div>

      <div className="p-5">
        {/* Preview card */}
        <div className="rounded-xl border border-[#00ff88]/20 bg-[#0a0a0a] p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/20 rounded px-1.5 py-0.5">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20">
              Active
            </span>
          </div>

          <h4 className="text-lg font-bold text-white">{title}</h4>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#666]">Entry Price</p>
              <p className="text-sm font-bold text-white mt-0.5">
                ${entryPrice > 0 ? entryPrice.toFixed(2) : '0.00'}{' '}
                <span className="text-[#666] text-xs font-normal">USDC</span>
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#666]">Duration</p>
              <p className="text-sm font-bold text-white mt-0.5">{durationLabel}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#666]">Max / User</p>
              <p className="text-sm font-bold text-white mt-0.5">{maxEntriesPerUser}</p>
            </div>
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#666]">Entry Cap</p>
              <p className="text-sm font-bold text-white mt-0.5">
                {entryCap ? entryCap.toLocaleString() : '∞'}
              </p>
            </div>
          </div>

          {/* Prize structure */}
          <div className="rounded-lg bg-[#00ff88]/[0.04] border border-[#00ff88]/10 p-3">
            <p className="text-[10px] uppercase tracking-wider text-[#00ff88]/70 mb-2">
              Prize Structure Preview
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#aaa]">Winner gets (90%)</span>
              <span className="font-bold text-[#00ff88]">
                ${winnerGets > 0 ? winnerGets.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-[#aaa]">Protocol fee (10%)</span>
              <span className="text-[#666]">
                ${estimatedPool > 0 ? (estimatedPool * 0.1).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
              </span>
            </div>
            <p className="text-[10px] text-[#555] mt-2">
              * Based on {entryCap || 500} entries estimate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
