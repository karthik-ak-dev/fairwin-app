/**
 * User Model - Shared across all games
 *
 * Represents a platform user identified by their wallet address.
 * This model aggregates user activity across ALL games (raffles, slots, poker, etc.).
 *
 * DynamoDB Table: FairWin-{Env}-Users
 * Primary Key: walletAddress (HASH)
 *
 * Use Cases:
 * - User profile display
 * - Aggregate statistics across games
 * - Activity tracking
 * - Win/loss analytics
 */
export interface UserItem {
  /**
   * Ethereum wallet address (Primary Key)
   * Format: 0x-prefixed hex string (42 characters)
   * Example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
   */
  walletAddress: string;

  /**
   * Total amount won across all games (in USDC smallest unit)
   * Incremented when user wins any game
   * 1 USDC = 1,000,000 (6 decimals)
   */
  totalWon: number;

  /**
   * Total amount spent on entries across all games (in USDC smallest unit)
   * Incremented when user buys entries/tickets/spins
   */
  totalSpent: number;

  /**
   * Total number of raffles the user has entered
   * Incremented once per raffle (regardless of number of tickets)
   * Note: Future games will have their own counter (slotsPlayed, pokerHandsPlayed, etc.)
   */
  rafflesEntered: number;

  /**
   * Total number of raffles the user has won
   * Incremented when user is selected as a winner in any raffle
   */
  rafflesWon: number;

  /**
   * Win rate as a decimal (0.0 to 1.0)
   * Calculated as: rafflesWon / rafflesEntered
   * Example: 0.25 = 25% win rate
   * Updated whenever rafflesWon or rafflesEntered changes
   */
  winRate: number;

  /**
   * Number of active (ongoing) raffle entries
   * Incremented when user enters a raffle
   * Decremented when raffle ends (win or lose)
   * Used to show "Active Entries" on user profile
   */
  activeEntries: number;

  /**
   * ISO 8601 timestamp of last user activity
   * Updated on every interaction (entry, claim, etc.)
   * Example: "2025-01-29T10:30:00.000Z"
   */
  lastActive: string;

  /**
   * ISO 8601 timestamp of when user first interacted with platform
   * Set once on user creation, never updated
   */
  createdAt: string;

  /**
   * ISO 8601 timestamp of last profile update
   * Updated whenever any user field changes
   */
  updatedAt: string;
}
