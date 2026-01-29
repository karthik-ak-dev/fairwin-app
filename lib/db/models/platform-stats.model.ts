/** Singleton item stored in the RAFFLES table with PK = 'PLATFORM_STATS' */
export interface PlatformStatsItem {
  raffleId: 'PLATFORM_STATS';
  totalRevenue: number;
  totalPaidOut: number;
  totalRaffles: number;
  totalEntries: number;
  totalPlayers: number;
  totalWinners: number;
  payoutStats?: {
    totalPaid: number;
    thisMonth: number;
    thisWeek: number;
    avgPayout: number;
    totalCount: number;
    pendingCount: number;
  };
}
