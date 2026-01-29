/**
 * Formatting utilities for the FairWin application.
 * All functions are pure, side-effect free, and SSR-safe.
 */

/**
 * Format a USDC amount (6 decimals on-chain) to a human-readable string.
 * Accepts raw bigint/number (in micro-USDC) or already-parsed float.
 *
 * @param amount - Amount in USDC (float) or micro-USDC (bigint/integer > 1000)
 * @param decimals - Display decimal places (default: 2)
 * @returns Formatted string like "$1,234.56"
 */
export function formatUSDC(
  amount: number | bigint | string,
  decimals: number = 2
): string {
  let value: number;

  if (typeof amount === "bigint") {
    value = Number(amount) / 1e6;
  } else if (typeof amount === "string") {
    value = parseFloat(amount);
    if (isNaN(value)) return "$0.00";
  } else {
    value = amount;
  }

  // If the value looks like raw micro-USDC (> 10,000), convert
  if (Number.isInteger(value) && Math.abs(value) >= 1_000_000) {
    value = value / 1e6;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Truncate an Ethereum/Polygon address to 0x1234...abcd format.
 *
 * @param address - Full hex address
 * @param startChars - Characters to show at start (default: 6)
 * @param endChars - Characters to show at end (default: 4)
 * @returns Truncated address string
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return "";
  if (address.length <= startChars + endChars + 3) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format seconds into a human-readable countdown or duration.
 *
 * @param seconds - Total seconds remaining
 * @param compact - Use compact format "1h 23m" vs "1 hour, 23 minutes"
 * @returns Formatted time string
 */
export function formatTime(seconds: number, compact: boolean = true): string {
  if (seconds <= 0) return compact ? "0s" : "0 seconds";

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (compact) {
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 && days === 0) parts.push(`${secs}s`);
    return parts.join(" ") || "0s";
  }

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
  if (secs > 0 && days === 0)
    parts.push(`${secs} second${secs !== 1 ? "s" : ""}`);
  return parts.join(", ") || "0 seconds";
}

/**
 * Format a number with locale-aware thousand separators.
 *
 * @param n - Number to format
 * @param opts - Intl.NumberFormat options override
 * @returns Formatted number string
 */
export function formatNumber(
  n: number | bigint | string,
  opts?: Intl.NumberFormatOptions
): string {
  const value = typeof n === "string" ? parseFloat(n) : Number(n);
  if (isNaN(value)) return "0";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    ...opts,
  }).format(value);
}

/**
 * Format a Date to a locale-friendly display string.
 *
 * @param date - Date object, ISO string, or Unix timestamp (ms)
 * @param opts - Intl.DateTimeFormat options override
 * @returns Formatted date string like "Jan 15, 2025, 3:30 PM"
 */
export function formatDate(
  date: Date | string | number,
  opts?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...opts,
  }).format(d);
}

/**
 * Format a date as a relative "time ago" string.
 *
 * @param date - Date object, ISO string, or Unix timestamp (ms)
 * @returns Relative string like "5 minutes ago", "2 hours ago", "just now"
 */
export function formatTimeAgo(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "—";

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 0) return "just now";
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;

  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear}y ago`;
}

/**
 * Format a percentage value.
 *
 * @param value - Percentage as a number (e.g. 10 for 10%)
 * @param decimals - Decimal places (default: 0)
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}
