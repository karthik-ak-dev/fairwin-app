'use client';

export interface WinFeedItemProps {
  wallet: string;
  raffle: string;
  prize: string;
  time: string;
}

export default function WinFeedItem({ wallet, raffle, prize, time }: WinFeedItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-8 h-8 rounded-full bg-[#00ff88]/10 flex items-center justify-center text-xs text-[#00ff88] font-bold flex-shrink-0">
          W
        </span>
        <div className="min-w-0">
          <span className="text-sm font-mono text-white">{wallet}</span>
          <p className="text-xs text-[#888888] truncate">{raffle}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-[#00ff88]">{prize}</p>
        <p className="text-xs text-[#888888]">{time}</p>
      </div>
    </div>
  );
}
