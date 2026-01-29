export interface PayoutItem {
  payoutId: string;      // PK
  raffleId: string;
  walletAddress: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  transactionHash?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreatePayoutInput = Pick<PayoutItem, 'raffleId' | 'walletAddress' | 'amount'>;
