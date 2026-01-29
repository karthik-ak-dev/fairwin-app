export interface UserItem {
  walletAddress: string; // PK
  totalWon: number;
  totalSpent: number;
  rafflesEntered: number;
  rafflesWon: number;
  winRate: number;
  activeEntries: number;
  lastActive: string;
  createdAt: string;
  updatedAt: string;
}
