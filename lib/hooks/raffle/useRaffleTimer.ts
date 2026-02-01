'use client';

import { useCountdown } from '@/shared/hooks/useCountdown';

interface RaffleTimerResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
  formatted: string;
  isEnding: boolean;
  isUrgent: boolean;
  stateLabel: string;
}

export function useRaffleTimer(endTime: string): RaffleTimerResult {
  const countdown = useCountdown(endTime);

  const isEnding = !countdown.isExpired && countdown.totalSeconds < 3600; // < 1 hour
  const isUrgent = !countdown.isExpired && countdown.totalSeconds < 900; // < 15 min

  let stateLabel: string;
  if (countdown.isExpired) {
    stateLabel = 'Ended';
  } else if (isUrgent) {
    stateLabel = 'ENDING!';
  } else if (isEnding) {
    stateLabel = 'Ending soon!';
  } else {
    stateLabel = `Ends in ${countdown.formatted}`;
  }

  return {
    ...countdown,
    isEnding,
    isUrgent,
    stateLabel,
  };
}
