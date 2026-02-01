'use client';

// ============================================================================
// Admin Raffle Detail — Countdown Timer (accepts endTime prop)
// ============================================================================

import { useCountdown } from '@/shared/hooks/useCountdown';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

interface AdminCountdownProps {
  endTime?: string;
}

export default function AdminCountdown({ endTime }: AdminCountdownProps) {
  const { hours, minutes, seconds, isExpired } = useCountdown(endTime ?? '');

  if (!endTime || isExpired) {
    return (
      <div className="rounded-xl bg-[#111111] border border-white/[0.06] p-5 text-center">
        <p className="text-sm text-[#888]">Raffle has ended</p>
      </div>
    );
  }

  const blocks = [
    { label: 'Hours', value: pad(hours) },
    { label: 'Mins', value: pad(minutes) },
    { label: 'Secs', value: pad(seconds) },
  ];

  return (
    <div className="rounded-xl bg-gradient-to-br from-[#00ff88] to-[#00cc6a] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
        Time Remaining
      </p>

      <div className="mt-3 flex items-center justify-center gap-3">
        {blocks.map((b, i) => (
          <div key={b.label} className="flex items-center gap-3">
            <div className="text-center">
              <p className="font-mono text-[40px] font-bold leading-none text-white">
                {b.value}
              </p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/60">
                {b.label}
              </p>
            </div>
            {i < blocks.length - 1 && (
              <span className="font-mono text-2xl font-bold text-white/40">:</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <p className="text-[12px] font-medium text-white/80">
          VRF Ready — Auto-draw enabled
        </p>
      </div>
    </div>
  );
}
