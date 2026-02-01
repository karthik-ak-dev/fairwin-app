'use client';

// ============================================================================
// Admin — Create Raffle Form
// ============================================================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateRaffle } from '@/lib/hooks/admin/useCreateRaffle';
import RafflePreview from './RafflePreview';

export default function CreateRaffleForm() {
  const router = useRouter();
  const { create, isCreating, isSuccess, error: createError } = useCreateRaffle();

  const [type, setType] = useState('daily');
  const [entryPrice, setEntryPrice] = useState(5);
  const [duration, setDuration] = useState(24);
  const [durationUnit, setDurationUnit] = useState('hours');
  const [maxEntriesPerUser, setMaxEntriesPerUser] = useState(10);
  const [entryCap, setEntryCap] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (entryPrice <= 0) e.entryPrice = 'Entry price must be greater than 0';
    if (duration <= 0) e.duration = 'Duration must be greater than 0';
    if (maxEntriesPerUser <= 0) e.maxEntriesPerUser = 'Must be at least 1';
    if (entryCap !== null && entryCap <= 0) e.entryCap = 'Entry cap must be positive';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isCreating) return;

    const durationSeconds = durationUnit === 'days' ? duration * 86400 : duration * 3600;

    // Generate title from type + timestamp
    const typeLabels: Record<string, string> = {
      daily: 'Daily Draw',
      weekly: 'Weekly Jackpot',
      monthly: 'Monthly Grand',
      flash: 'Flash Raffle',
      mega: 'Mega Jackpot',
    };

    create(
      {
        title: `${typeLabels[type] || type}`,
        type,
        entryPrice,
        maxEntriesPerUser,
        duration: durationSeconds,
        winnersCount: 3, // Default
      },
      {
        onSuccess: () => {
          router.push('/admin/raffles');
        },
      }
    );
  };

  return (
    <div className="grid grid-cols-5 gap-6">
      {/* Form */}
      <div className="col-span-3">
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.06] bg-[#111111] p-6 space-y-5">
          {/* API Error */}
          {createError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{createError.message}</p>
            </div>
          )}

          {/* Success */}
          {isSuccess && (
            <div className="p-3 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/20">
              <p className="text-sm text-[#00ff88]">Raffle created successfully! Redirecting...</p>
            </div>
          )}

          {/* Raffle Type */}
          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1.5">Raffle Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00ff88]/40"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="flash">Flash</option>
              <option value="mega">Mega</option>
            </select>
          </div>

          {/* Entry Price */}
          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1.5">Entry Price</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step={0.01}
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-white px-3 py-2.5 pr-16 text-sm focus:outline-none focus:border-[#00ff88]/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#666]">
                USDC
              </span>
            </div>
            {errors.entryPrice && (
              <p className="text-xs text-red-400 mt-1">{errors.entryPrice}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1.5">Duration</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00ff88]/40"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                className="w-28 rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00ff88]/40"
              >
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            {errors.duration && (
              <p className="text-xs text-red-400 mt-1">{errors.duration}</p>
            )}
          </div>

          {/* Max Entries Per User */}
          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1.5">
              Max Entries Per User
            </label>
            <input
              type="number"
              min={1}
              value={maxEntriesPerUser}
              onChange={(e) => setMaxEntriesPerUser(Number(e.target.value))}
              className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-white px-3 py-2.5 text-sm focus:outline-none focus:border-[#00ff88]/40"
            />
            {errors.maxEntriesPerUser && (
              <p className="text-xs text-red-400 mt-1">{errors.maxEntriesPerUser}</p>
            )}
          </div>

          {/* Entry Cap */}
          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1.5">
              Entry Cap <span className="text-[#555]">(optional)</span>
            </label>
            <input
              type="number"
              min={1}
              placeholder="No limit"
              value={entryCap ?? ''}
              onChange={(e) =>
                setEntryCap(e.target.value === '' ? null : Number(e.target.value))
              }
              className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] text-white placeholder:text-[#444] px-3 py-2.5 text-sm focus:outline-none focus:border-[#00ff88]/40"
            />
            {errors.entryCap && (
              <p className="text-xs text-red-400 mt-1">{errors.entryCap}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isCreating}
            className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
              isCreating
                ? 'bg-[#00ff88]/50 text-black/50 cursor-not-allowed'
                : 'bg-[#00ff88] text-black hover:bg-[#00ff88]/90'
            }`}
          >
            {isCreating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating...
              </span>
            ) : (
              'Create Raffle'
            )}
          </button>
        </form>
      </div>

      {/* Preview */}
      <div className="col-span-2">
        <RafflePreview
          type={type}
          entryPrice={entryPrice}
          duration={duration}
          durationUnit={durationUnit}
          maxEntriesPerUser={maxEntriesPerUser}
          entryCap={entryCap}
        />
      </div>
    </div>
  );
}
