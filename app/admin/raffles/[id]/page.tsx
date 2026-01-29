'use client';

// ============================================================================
// Admin — Raffle Detail Page (real data)
// ============================================================================

import { use } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/shared/hooks/useAdmin';
import { useRaffle } from '@/features/raffle/hooks/useRaffle';
import { RAFFLE_STATE_CONFIG } from '@/features/raffle/constants';
import { formatUSDC, formatNumber, formatDate } from '@/shared/utils/format';
import { Skeleton } from '@/shared/components/ui';
import ParticipantsList from '@/features/raffle/components/ParticipantsList';
import PastWinners from '@/features/raffle/components/PastWinners';
import RaffleTimer from '@/features/raffle/components/RaffleTimer';

export default function AdminRaffleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isAdmin, isConnected } = useAdmin();
  const { raffle, isLoading, error } = useRaffle(id);

  if (!isConnected || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-10 rounded-2xl border border-red-500/20 bg-red-500/[0.05] max-w-md w-full">
          <span className="text-[48px] block mb-4">🚫</span>
          <h2 className="text-xl font-bold text-red-400 mb-2">Unauthorized</h2>
          <p className="text-sm text-[#888888]">Connect an admin wallet to view this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-64 h-8" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  if (error || !raffle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-10 rounded-2xl border border-red-500/20 bg-red-500/[0.05] max-w-md w-full">
          <span className="text-[48px] block mb-4">⚠️</span>
          <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load Raffle</h2>
          <p className="text-sm text-[#888888]">
            {error instanceof Error ? error.message : 'Raffle not found'}
          </p>
        </div>
      </div>
    );
  }

  const stateConfig = RAFFLE_STATE_CONFIG[raffle.state];
  const isLive = raffle.state === 'active' || raffle.state === 'ending';

  return (
    <div className="space-y-6">
      <Link
        href="/admin/raffles"
        className="inline-flex items-center gap-1 text-sm text-[#888] transition-colors hover:text-white"
      >
        ← Back to Raffles
      </Link>

      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold text-white">🎟️ {raffle.title}</h1>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold border ${stateConfig.bgColor} ${stateConfig.color} ${stateConfig.borderColor}`}
        >
          {stateConfig.label}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Prize Pool', value: formatUSDC(raffle.prizePool), highlight: true },
          { label: 'Total Entries', value: formatNumber(raffle.totalEntries) },
          { label: 'Participants', value: formatNumber(raffle.totalParticipants) },
          { label: 'Entry Price', value: formatUSDC(raffle.entryPrice) },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border px-5 py-4 ${
              s.highlight
                ? 'bg-[#00ff88]/[0.06] border-[#00ff88]/20'
                : 'bg-[#111111] border-white/[0.06]'
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#888]">
              {s.label}
            </p>
            <p className={`mt-1 text-[28px] font-bold leading-tight ${s.highlight ? 'text-[#00ff88]' : 'text-white'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Timer + Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ParticipantsList raffleId={raffle.id} />
          <PastWinners raffleId={raffle.id} />
        </div>

        <div className="space-y-6">
          {/* Timer Card */}
          {isLive && (
            <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">⏱ Time Remaining</h3>
              <RaffleTimer endTime={raffle.endTime} />
            </div>
          )}

          {/* Info Card */}
          <div className="rounded-xl border border-white/[0.06] bg-[#111111] p-6 space-y-3">
            <h3 className="text-sm font-semibold text-white mb-4">📋 Raffle Info</h3>
            {[
              { label: 'Type', value: raffle.type },
              { label: 'Max Entries/User', value: String(raffle.maxEntriesPerUser) },
              { label: 'Start Time', value: formatDate(raffle.startTime) },
              { label: 'End Time', value: formatDate(raffle.endTime) },
              { label: 'Contract', value: raffle.contractAddress ? `${raffle.contractAddress.slice(0, 10)}...` : '—' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-[#888]">{item.label}</span>
                <span className="text-white font-mono text-xs">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
