// ============================================================================
// Raffle Feature — Constants
// ============================================================================

import type { RaffleState, RaffleType } from './types';

// ---------------------------------------------------------------------------
// Raffle Types
// ---------------------------------------------------------------------------

export interface RaffleTypeConfig {
  value: RaffleType;
  label: string;
  icon: string;
  description: string;
  /** Typical duration in human-readable form */
  duration: string;
  /** Accent color class for badges / tags */
  colorClass: string;
}

export const RAFFLE_TYPES: RaffleTypeConfig[] = [
  {
    value: 'daily',
    label: 'Daily',
    icon: '☀️',
    description: 'A new raffle every 24 hours',
    duration: '24h',
    colorClass: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  {
    value: 'weekly',
    label: 'Weekly',
    icon: '📅',
    description: 'Larger pools drawn every week',
    duration: '7d',
    colorClass: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    icon: '🗓️',
    description: 'Massive monthly jackpots',
    duration: '30d',
    colorClass: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  },
  {
    value: 'flash',
    label: 'Flash',
    icon: '⚡',
    description: 'Quick-fire raffles, limited time',
    duration: '1–6h',
    colorClass: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  },
  {
    value: 'mega',
    label: 'Mega',
    icon: '💎',
    description: 'Special event mega jackpot',
    duration: 'Varies',
    colorClass: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  },
] as const;

// ---------------------------------------------------------------------------
// Entry Pricing
// ---------------------------------------------------------------------------

/** Default entry prices per raffle type (in MATIC) */
export const DEFAULT_ENTRY_PRICES: Record<RaffleType, number> = {
  daily: 1,
  weekly: 5,
  monthly: 10,
  flash: 0.5,
  mega: 25,
};

// ---------------------------------------------------------------------------
// Entry Limits
// ---------------------------------------------------------------------------

/** Max entries a single wallet can buy per raffle type */
export const MAX_ENTRIES_PER_USER: Record<RaffleType, number> = {
  daily: 10,
  weekly: 25,
  monthly: 50,
  flash: 5,
  mega: 100,
};

// ---------------------------------------------------------------------------
// Prize Distribution
// ---------------------------------------------------------------------------

export interface PrizeDistributionTier {
  name: string;
  icon: string;
  /** Percentage of total prize pool (0–100) */
  percentage: number;
  /** Default number of winners for this tier */
  defaultWinners: number;
  /** Tailwind color class */
  colorClass: string;
}

export const PRIZE_DISTRIBUTION: PrizeDistributionTier[] = [
  {
    name: 'Grand Prize',
    icon: '🏆',
    percentage: 40,
    defaultWinners: 1,
    colorClass: 'text-[#FFD700]',
  },
  {
    name: 'Runner Up',
    icon: '🥈',
    percentage: 30,
    defaultWinners: 3,
    colorClass: 'text-[#C0C0C0]',
  },
  {
    name: 'Lucky Draw',
    icon: '🍀',
    percentage: 30,
    defaultWinners: 10,
    colorClass: 'text-[#00ff88]',
  },
] as const;

// ---------------------------------------------------------------------------
// Raffle State Configuration
// ---------------------------------------------------------------------------

export interface RaffleStateConfig {
  label: string;
  /** Tailwind text color class */
  color: string;
  /** Tailwind background color class (low-opacity) */
  bgColor: string;
  /** Tailwind border color class */
  borderColor: string;
  /** Dot indicator color */
  dotColor: string;
  /** Whether the raffle accepts entries in this state */
  acceptsEntries: boolean;
}

export const RAFFLE_STATE_CONFIG: Record<RaffleState, RaffleStateConfig> = {
  scheduled: {
    label: 'Scheduled',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/20',
    dotColor: 'bg-blue-400',
    acceptsEntries: false,
  },
  active: {
    label: 'Active',
    color: 'text-[#00ff88]',
    bgColor: 'bg-[#00ff88]/10',
    borderColor: 'border-[#00ff88]/20',
    dotColor: 'bg-[#00ff88]',
    acceptsEntries: true,
  },
  ending: {
    label: 'Ending Soon',
    color: 'text-[#f97316]',
    bgColor: 'bg-[#f97316]/10',
    borderColor: 'border-[#f97316]/20',
    dotColor: 'bg-[#f97316]',
    acceptsEntries: true,
  },
  drawing: {
    label: 'Drawing',
    color: 'text-[#FFD700]',
    bgColor: 'bg-[#FFD700]/10',
    borderColor: 'border-[#FFD700]/20',
    dotColor: 'bg-[#FFD700]',
    acceptsEntries: false,
  },
  ended: {
    label: 'Ended',
    color: 'text-[#888888]',
    bgColor: 'bg-[#888888]/10',
    borderColor: 'border-[#888888]/20',
    dotColor: 'bg-[#888888]',
    acceptsEntries: false,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-[#ff4444]',
    bgColor: 'bg-[#ff4444]/10',
    borderColor: 'border-[#ff4444]/20',
    dotColor: 'bg-[#ff4444]',
    acceptsEntries: false,
  },
};
