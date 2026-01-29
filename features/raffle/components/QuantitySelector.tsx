'use client';

import { useState } from 'react';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  max: number;
}

const PRESETS = [1, 5, 10, 25];

export default function QuantitySelector({
  value,
  onChange,
  max,
}: QuantitySelectorProps) {
  const [customMode, setCustomMode] = useState(false);

  const handlePreset = (preset: number) => {
    const clamped = Math.min(preset, max);
    setCustomMode(false);
    onChange(clamped);
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleDecrement = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      onChange(1);
      return;
    }
    const num = parseInt(raw, 10);
    onChange(Math.min(Math.max(1, num), max));
  };

  const isPresetActive = (preset: number) =>
    !customMode && value === Math.min(preset, max);

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#888888] font-medium uppercase tracking-wider">
          Quantity
        </span>
        <span className="text-xs text-[#888888]">
          Max: <span className="text-white font-medium">{max}</span>
        </span>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((preset) => {
          const disabled = preset > max;
          const active = isPresetActive(preset);

          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => handlePreset(preset)}
              className={`
                py-2.5 rounded-lg text-sm font-bold transition-all duration-200 border
                ${
                  active
                    ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                    : disabled
                    ? 'border-white/[0.06] bg-white/[0.02] text-[#555] cursor-not-allowed'
                    : 'border-white/[0.08] bg-white/[0.03] text-white hover:border-[#00ff88]/40 hover:bg-[#00ff88]/5'
                }
              `}
            >
              {preset}
            </button>
          );
        })}
      </div>

      {/* Custom input with +/- */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= 1}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 border
            ${
              value <= 1
                ? 'border-white/[0.06] text-[#555] cursor-not-allowed'
                : 'border-white/[0.12] text-white hover:border-[#00ff88]/40 hover:text-[#00ff88] bg-white/[0.03]'
            }
          `}
        >
          −
        </button>

        <input
          type="text"
          inputMode="numeric"
          value={value}
          onFocus={() => setCustomMode(true)}
          onChange={handleCustomInput}
          className="flex-1 h-10 rounded-lg bg-white/[0.05] border border-white/[0.08] text-center text-white text-lg font-bold font-mono focus:outline-none focus:border-[#00ff88]/40 transition-colors"
        />

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-200 border
            ${
              value >= max
                ? 'border-white/[0.06] text-[#555] cursor-not-allowed'
                : 'border-white/[0.12] text-white hover:border-[#00ff88]/40 hover:text-[#00ff88] bg-white/[0.03]'
            }
          `}
        >
          +
        </button>
      </div>
    </div>
  );
}
