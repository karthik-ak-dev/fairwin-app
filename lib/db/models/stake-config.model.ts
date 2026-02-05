// StakeConfig model
// Responsibilities:
// - Define available staking plans/configurations
// - Each config represents a staking option (e.g., "24 months @ 8%")
// - Immutable once created - don't modify existing configs
// - Create new configs for new plans

export interface StakeConfig {
  // Primary Key
  stakeConfigId: string; // Readable ID like "8_PERCENT_24_MONTHS"

  // Configuration Details
  durationMonths: number; // Stake duration (e.g., 24 months)
  monthlyReturnRate: number; // Monthly return rate (e.g., 0.08 for 8%)

  // Display Information
  name: string; // Display name (e.g., "Premium 24 Month Plan")
  description?: string; // Optional description

  // Validation
  minStake: number; // Minimum stake amount (e.g., 50 USDT)
  maxStake: number; // Maximum stake amount (e.g., 10000 USDT)

  // Status
  isActive: boolean; // Whether this config is available for new stakes

  // Timestamps (ISO 8601 strings)
  createdAt: string; // When this config was created
  updatedAt: string; // Last update timestamp
}

/**
 * Sample JSON for creating the default stake config in DynamoDB console
 * Copy this JSON and paste it directly into DynamoDB console's JSON editor:
 *
 * {
 *   "stakeConfigId": "8_PERCENT_24_MONTHS",
 *   "durationMonths": 24,
 *   "monthlyReturnRate": 0.08,
 *   "name": "Standard 24 Month Plan",
 *   "description": "8% monthly returns over 24 months",
 *   "minStake": 50,
 *   "maxStake": 10000,
 *   "isActive": true,
 *   "createdAt": "2026-02-05T00:00:00.000Z",
 *   "updatedAt": "2026-02-05T00:00:00.000Z"
 * }
 */
