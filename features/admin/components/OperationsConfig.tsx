'use client';

// ============================================================================
// Settings — Operations Configuration
// ============================================================================

import { useState } from 'react';

interface ToggleRow {
  key: string;
  label: string;
  description: string;
}

const TOGGLES: ToggleRow[] = [
  {
    key: 'autoTrigger',
    label: 'Auto-trigger draws',
    description: 'Automatically trigger VRF when raffle ends',
  },
  {
    key: 'autoCreate',
    label: 'Auto-create recurring',
    description: 'Automatically create next raffle after draw',
  },
  {
    key: 'lowBalance',
    label: 'Low balance alerts',
    description: 'Notify when gas or LINK balance is low',
  },
];

export default function OperationsConfig() {
  const [active, setActive] = useState<Record<string, boolean>>({
    autoTrigger: true,
    autoCreate: true,
    lowBalance: true,
  });

  const toggle = (key: string) =>
    setActive((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-6">
      <h3 className="text-base font-semibold text-white">🔧 Operations</h3>

      <div className="mt-5 space-y-4">
        {TOGGLES.map((t) => {
          const on = active[t.key];
          return (
            <div
              key={t.key}
              className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-[#0a0a0a] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{t.label}</p>
                <p className="mt-0.5 text-[12px] text-[#888]">
                  {t.description}
                </p>
              </div>

              {/* Custom toggle */}
              <button
                type="button"
                onClick={() => toggle(t.key)}
                className={`relative h-6 w-12 rounded-full transition-colors ${
                  on ? 'bg-[#00ff88]' : 'bg-[#333]'
                }`}
                aria-label={`Toggle ${t.label}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    on ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
