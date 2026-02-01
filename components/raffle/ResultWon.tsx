'use client';

import Link from 'next/link';
import { formatUSDC } from '@/shared/utils/format';
import { getTransactionUrl } from '@/shared/utils/constants';

const CONFETTI_COLORS = [
  '#00ff88', '#FFD700', '#f97316', '#3b82f6', '#a855f7',
  '#ff4444', '#C0C0C0', '#00ff88', '#FFD700', '#f97316',
  '#3b82f6', '#a855f7', '#00ff88', '#FFD700', '#f97316', '#3b82f6',
];

const TIER_LABELS: Record<string, string> = {
  grand: '🥇 Grand Prize Winner',
  'runner-up': '🥈 Runner-up',
  lucky: '🍀 Lucky Winner',
};

interface ResultWonProps {
  prize: number;
  tier: string;
  raffleTitle: string;
  txHash?: string;
}

export default function ResultWon({ prize, tier, raffleTitle, txHash }: ResultWonProps) {
  const tierLabel = TIER_LABELS[tier] || `🏆 ${tier}`;

  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center py-16 px-4 overflow-hidden">
      {/* CSS Confetti */}
      {CONFETTI_COLORS.map((color, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 opacity-0"
          style={{
            backgroundColor: color,
            left: `${5 + (i / CONFETTI_COLORS.length) * 90}%`,
            top: '-20px',
            borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0',
            animation: `confetti-fall ${2.5 + (i % 3) * 0.5}s ease-out ${i * 0.15}s forwards`,
          }}
        />
      ))}

      <div className="text-[64px] leading-none mb-6 animate-bounce">🏆</div>

      <h1
        className="text-4xl sm:text-5xl font-bold mb-3 text-center bg-clip-text text-transparent"
        style={{ backgroundImage: 'linear-gradient(135deg, #00ff88, #FFD700)' }}
      >
        🎉 YOU WON!
      </h1>
      <p className="text-[#888888] text-sm mb-10 text-center">
        Congratulations! Lady luck smiled on you today.
      </p>

      {/* Prize Card */}
      <div className="relative rounded-2xl border border-[#FFD700]/30 bg-gradient-to-br from-[#FFD700]/10 to-transparent p-8 text-center w-full max-w-md overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 w-[200%] h-full opacity-10"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 50%, transparent 100%)',
              animation: 'shimmer 2s infinite',
            }}
          />
        </div>

        <div className="relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20 mb-4">
            {tierLabel}
          </span>

          <p className="text-[40px] sm:text-[48px] font-bold text-[#00ff88] font-mono leading-tight mb-2">
            {formatUSDC(prize)}
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00ff88]/10 text-[#00ff88] text-xs font-semibold mt-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
            Paid to your wallet
          </div>
        </div>
      </div>

      {/* Raffle Info */}
      <div className="mt-6 w-full max-w-md rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#888888]">Raffle</span>
          <span className="text-white">{raffleTitle}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 w-full max-w-md">
        {txHash && (
          <a
            href={getTransactionUrl(txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 w-full py-3 rounded-xl border border-white/[0.12] bg-white/[0.03] text-white text-sm font-semibold text-center transition-all hover:border-white/[0.2] hover:bg-white/[0.05]"
          >
            View Transaction ↗
          </a>
        )}
        <Link
          href="/games/raffle"
          className="flex-1 w-full py-3 rounded-xl bg-[#00ff88] text-black text-sm font-bold text-center transition-all hover:brightness-110"
        >
          Enter Another Raffle
        </Link>
      </div>
    </div>
  );
}
