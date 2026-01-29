export interface RaffleItem {
  raffleId: string;
  type: 'daily' | 'weekly' | 'mega' | 'flash' | 'monthly';
  status: 'scheduled' | 'active' | 'ending' | 'drawing' | 'completed' | 'cancelled';
  title: string;
  description: string;
  entryPrice: number;
  maxEntriesPerUser: number;
  totalEntries: number;
  totalParticipants: number;
  prizePool: number;
  protocolFee: number;
  winnerPayout: number;
  startTime: string; // ISO 8601
  endTime: string;
  drawTime?: string;
  vrfRequestId?: string;
  vrfRandomWord?: string;
  contractAddress: string;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateRaffleInput = Pick<
  RaffleItem,
  'type' | 'title' | 'description' | 'entryPrice' | 'maxEntriesPerUser' | 'startTime' | 'endTime'
>;
