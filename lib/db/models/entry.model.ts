export interface EntryItem {
  raffleId: string;     // PK
  entryId: string;      // SK
  walletAddress: string;
  numEntries: number;
  totalPaid: number;
  transactionHash: string;
  blockNumber: number;
  status: 'confirmed' | 'pending' | 'failed';
  createdAt: string;
}

export type CreateEntryInput = Pick<
  EntryItem,
  'raffleId' | 'walletAddress' | 'numEntries' | 'totalPaid' | 'transactionHash' | 'blockNumber'
>;
