'use client';

export interface DrawRowProps {
  name: string;
  pool: string;
  entries: string;
  timeLeft: string;
  status: 'live' | 'drawing' | 'ended';
}

export default function DrawRow({ name, pool, entries, timeLeft, status }: DrawRowProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            status === 'live'
              ? 'bg-[#00ff88] animate-pulse'
              : status === 'drawing'
              ? 'bg-yellow-400 animate-pulse'
              : 'bg-[#888888]'
          }`}
        />
        <span className="text-sm text-white font-medium truncate">{name}</span>
      </div>
      <div className="flex items-center gap-8 flex-shrink-0">
        <span className="text-sm text-[#00ff88] font-semibold w-24 text-right">{pool}</span>
        <span className="text-sm text-[#888888] w-20 text-right">{entries}</span>
        <span className="text-sm text-[#888888] w-20 text-right">{timeLeft}</span>
      </div>
    </div>
  );
}
