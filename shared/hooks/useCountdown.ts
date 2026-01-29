'use client';

import { useState, useEffect, useCallback } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
  formatted: string;
}

function calcRemaining(targetDate: string | Date | number): number {
  const target = typeof targetDate === 'object' && targetDate instanceof Date
    ? targetDate.getTime()
    : typeof targetDate === 'number'
      ? targetDate
      : new Date(targetDate).getTime();

  const diff = target - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useCountdown(targetDate: string | Date | number): CountdownResult {
  const [totalSeconds, setTotalSeconds] = useState<number>(() => calcRemaining(targetDate));

  const update = useCallback(() => {
    setTotalSeconds(calcRemaining(targetDate));
  }, [targetDate]);

  useEffect(() => {
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [update]);

  const isExpired = totalSeconds <= 0;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired,
    totalSeconds,
    formatted: isExpired ? '00:00:00' : formatCountdown(totalSeconds),
  };
}
