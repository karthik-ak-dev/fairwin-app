'use client';

import { useState, useEffect } from 'react';

interface RaffleTimerProps {
  endTime: string;
  compact?: boolean;
}

function padZero(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function RaffleTimer({ endTime, compact }: RaffleTimerProps) {
  const [remaining, setRemaining] = useState<number>(() => {
    const diff = new Date(endTime).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(diff / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const isUrgent = remaining < 3600; // < 1 hour
  const isCritical = remaining < 900; // < 15 min
  const isExpired = remaining <= 0;

  if (isExpired) {
    return (
      <span
        className={`${
          compact ? 'text-xs' : 'text-2xl'
        } font-mono font-bold text-[#888888]`}
      >
        Ended
      </span>
    );
  }

  const colorClass = isCritical
    ? 'text-[#f97316]'
    : isUrgent
    ? 'text-[#f97316]'
    : 'text-white';

  const animClass = isCritical ? 'animate-pulse' : '';

  if (compact) {
    return (
      <span className={`text-xs font-mono font-medium ${colorClass} ${animClass}`}>
        {hours > 0 && `${hours}h `}
        {minutes}m {padZero(seconds)}s
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${animClass}`}>
      {/* Hours */}
      <div className="flex flex-col items-center">
        <span
          className={`text-4xl md:text-5xl font-mono font-bold tabular-nums ${colorClass}`}
        >
          {padZero(hours)}
        </span>
        <span className="text-[10px] text-[#888888] uppercase tracking-wider mt-1">
          Hrs
        </span>
      </div>
      <span className={`text-3xl md:text-4xl font-bold ${colorClass} -mt-4`}>
        :
      </span>
      {/* Minutes */}
      <div className="flex flex-col items-center">
        <span
          className={`text-4xl md:text-5xl font-mono font-bold tabular-nums ${colorClass}`}
        >
          {padZero(minutes)}
        </span>
        <span className="text-[10px] text-[#888888] uppercase tracking-wider mt-1">
          Min
        </span>
      </div>
      <span className={`text-3xl md:text-4xl font-bold ${colorClass} -mt-4`}>
        :
      </span>
      {/* Seconds */}
      <div className="flex flex-col items-center">
        <span
          className={`text-4xl md:text-5xl font-mono font-bold tabular-nums ${colorClass}`}
        >
          {padZero(seconds)}
        </span>
        <span className="text-[10px] text-[#888888] uppercase tracking-wider mt-1">
          Sec
        </span>
      </div>
    </div>
  );
}
