export interface WinnerItem {
  raffleId: string;      // PK
  rank: number;          // SK
  walletAddress: string;
  prize: number;
  tier: 'grand' | 'runner-up' | 'lucky';
  transactionHash?: string;
  paidAt?: string;
  createdAt: string;
}

export type CreateWinnerInput = Pick<
  WinnerItem,
  'raffleId' | 'rank' | 'walletAddress' | 'prize' | 'tier'
>;
