'use client';

import Link from 'next/link';
import { formatUSDC, formatAddress } from '@/shared/utils/format';
import type { WinnerItem } from '@/lib/db/models';

interface ResultLostProps {
  raffleTitle: string;
  winners: WinnerItem[];
  totalEntries: number;
}

export default function ResultLost({ raffleTitle, winners, totalEntries }: ResultLostProps) {
  const grandWinner = winners.find((w) => w.tier === 'grand') ?? winners[0];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
      <div className="text-[64px] leading-none mb-6">🎟️</div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 text-center">
        Better Luck Next Time!
      </h1>
      <p className="text-sm text-[#888888] mb-10 text-center max-w-md">
        You didn&apos;t win this round, but every draw is a new chance. The odds
        are always in someone&apos;s favor — next time, it could be you.
      </p>

      {/* Entry Summary Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0a0a] p-6 mb-6">
        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">
          Raffle Summary
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#888888]">Raffle</span>
            <span className="text-sm font-bold text-white">{raffleTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#888888]">Total Entries</span>
            <span className="text-sm font-mono text-white">
              {totalEntries.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#888888]">Winners</span>
            <span className="text-sm font-bold text-[#00ff88]">{winners.length}</span>
          </div>
        </div>
      </div>

      {/* Winner Info */}
      {grandWinner && (
        <div className="w-full max-w-md rounded-xl border border-[#FFD700]/20 bg-[#FFD700]/[0.03] p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-xs text-[#888888] mb-0.5">Grand Prize Winner</p>
                <p className="text-sm font-mono text-white">
                  {formatAddress(grandWinner.walletAddress)}
                </p>
              </div>
            </div>
            <p className="text-lg font-bold text-[#FFD700]">
              {formatUSDC(grandWinner.prize)}
            </p>
          </div>
        </div>
      )}

      {/* Try Again */}
      <div className="w-full max-w-md text-center">
        <p className="text-sm text-[#888888] mb-4">Try again?</p>
        <Link
          href="/games/raffle"
          className="inline-flex px-8 py-3 rounded-xl bg-[#00ff88] text-black text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)]"
        >
          🎟️ Enter Next Raffle
        </Link>
      </div>
    </div>
  );
}
