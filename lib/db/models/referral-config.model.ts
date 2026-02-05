// ReferralConfig model
// Responsibilities:
// - Define referral commission structure
// - Singleton config - only one active config at a time
// - Create new config to change referral rates (don't modify existing)

export interface ReferralConfig {
  // Primary Key
  referralConfigId: string; // ID like "5_LEVEL_STANDARD"

  // Commission Configuration
  commissionRates: number[]; // Array of rates per level (e.g., [0.08, 0.03, 0.02, 0.01, 0.01])
  maxLevels: number; // Maximum referral depth (e.g., 5)

  // Display Information
  name: string; // Display name (e.g., "Standard 5-Level Commission")
  description?: string; // Optional description

  // Status
  isActive: boolean; // Whether this config is currently active

  // Timestamps (ISO 8601 strings)
  createdAt: string; // When this config was created
  updatedAt: string; // Last update timestamp
}

/**
 * Sample JSON for creating the default referral config in DynamoDB console
 * Copy this JSON and paste it directly into DynamoDB console's JSON editor:
 *
 * {
 *   "referralConfigId": "5_LEVEL_STANDARD",
 *   "commissionRates": [0.08, 0.03, 0.02, 0.01, 0.01],
 *   "maxLevels": 5,
 *   "name": "Standard 5-Level Commission",
 *   "description": "8% → 3% → 2% → 1% → 1% across 5 referral levels",
 *   "isActive": true,
 *   "createdAt": "2026-02-05T00:00:00.000Z",
 *   "updatedAt": "2026-02-05T00:00:00.000Z"
 * }
 */
