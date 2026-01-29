/**
 * Application-wide constants for FairWin.
 * All monetary values are in USDC unless otherwise noted.
 */

// ─── Branding ────────────────────────────────────────────────
export const APP_NAME = "FairWin" as const;
export const APP_DESCRIPTION =
  "Provably fair on-chain raffles powered by Polygon" as const;
export const APP_URL = "https://fairwin.io" as const;

// ─── Protocol Economics ──────────────────────────────────────
/** Protocol fee as a percentage of each raffle's total pool */
export const PROTOCOL_FEE_PERCENT = 10 as const;
/** Winner's share as a percentage of each raffle's total pool */
export const WINNER_SHARE_PERCENT = 90 as const;
/** Minimum participants required before a raffle can draw */
export const MIN_PARTICIPANTS = 2 as const;

// ─── Entry Prices (USDC) ────────────────────────────────────
export const ENTRY_PRICES = [1, 5, 10, 25, 50, 100, 250, 500, 1000] as const;
export type EntryPrice = (typeof ENTRY_PRICES)[number];

// ─── Raffle Types ────────────────────────────────────────────
export const RAFFLE_TYPES = {
  STANDARD: "standard",
  WHALE: "whale",
  MINI: "mini",
  FLASH: "flash",
} as const;
export type RaffleType = (typeof RAFFLE_TYPES)[keyof typeof RAFFLE_TYPES];

export const RAFFLE_TYPE_LABELS: Record<RaffleType, string> = {
  [RAFFLE_TYPES.STANDARD]: "Standard",
  [RAFFLE_TYPES.WHALE]: "Whale",
  [RAFFLE_TYPES.MINI]: "Mini",
  [RAFFLE_TYPES.FLASH]: "Flash",
};

// ─── Raffle Statuses ─────────────────────────────────────────
export const RAFFLE_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  ENDING: "ending",
  DRAWING: "drawing",
  ENDED: "ended",
  CANCELLED: "cancelled",
} as const;
export type RaffleStatus =
  (typeof RAFFLE_STATUS)[keyof typeof RAFFLE_STATUS];

export const RAFFLE_STATUS_LABELS: Record<RaffleStatus, string> = {
  [RAFFLE_STATUS.SCHEDULED]: "Scheduled",
  [RAFFLE_STATUS.LIVE]: "Live",
  [RAFFLE_STATUS.ENDING]: "Ending Soon",
  [RAFFLE_STATUS.DRAWING]: "Drawing",
  [RAFFLE_STATUS.ENDED]: "Ended",
  [RAFFLE_STATUS.CANCELLED]: "Cancelled",
};

// ─── Time Constants ──────────────────────────────────────────
/** Time in seconds before end when raffle is considered "ending" */
export const ENDING_THRESHOLD_SECONDS = 300 as const; // 5 minutes
/** Default raffle duration in seconds */
export const DEFAULT_DURATION_SECONDS = 3600 as const; // 1 hour
/** Maximum raffle duration in seconds */
export const MAX_DURATION_SECONDS = 604800 as const; // 7 days
/** Minimum raffle duration in seconds */
export const MIN_DURATION_SECONDS = 300 as const; // 5 minutes

// ─── Pagination ──────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20 as const;
export const MAX_PAGE_SIZE = 100 as const;

// ─── Blockchain / Network ────────────────────────────────────
export const CHAIN_ID = 137 as const; // Polygon Mainnet
export const CHAIN_NAME = "Polygon" as const;
export const POLYGONSCAN_URL = "https://polygonscan.com" as const;
export const POLYGONSCAN_TESTNET_URL = "https://amoy.polygonscan.com" as const;

/** Build a Polygonscan link for a transaction hash */
export function getTransactionUrl(
  txHash: string,
  testnet: boolean = false
): string {
  const base = testnet ? POLYGONSCAN_TESTNET_URL : POLYGONSCAN_URL;
  return `${base}/tx/${txHash}`;
}

/** Build a Polygonscan link for an address */
export function getAddressUrl(
  address: string,
  testnet: boolean = false
): string {
  const base = testnet ? POLYGONSCAN_TESTNET_URL : POLYGONSCAN_URL;
  return `${base}/address/${address}`;
}

// ─── USDC Contract ───────────────────────────────────────────
export const USDC_ADDRESS =
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as const; // Polygon USDC
export const USDC_DECIMALS = 6 as const;

// ─── Design Tokens (for reference / JS usage) ────────────────
export const COLORS = {
  bg: "#000000",
  bgCard: "rgba(255,255,255,0.03)",
  bgAdmin: "#0a0a0a",
  accent: "#00ff88",
  text: "#ffffff",
  textMuted: "#888888",
  border: "rgba(255,255,255,0.08)",
  gold: "#FFD700",
  silver: "#C0C0C0",
  warning: "#f97316",
  danger: "#ff4444",
} as const;

// ─── External Links ──────────────────────────────────────────
export const LINKS = {
  docs: "https://docs.fairwin.io",
  twitter: "https://twitter.com/fairwin",
  discord: "https://discord.gg/fairwin",
  github: "https://github.com/fairwin",
} as const;
