/**
 * Formatting utilities for display
 */

// ============================================================================
// Currency Constants
// ============================================================================

/**
 * USDC uses 6 decimal places (same as on-chain representation)
 * Example: 1 USDC = 1,000,000 smallest units
 */
export const USDC_DECIMALS = 6;
export const USDC_UNIT = Math.pow(10, USDC_DECIMALS); // 1000000

/**
 * Convert from smallest unit to display value
 * @param amount - Amount in smallest unit (e.g., 1000000 = 1 USDC)
 * @returns Display value (e.g., 1.0)
 */
export function toDisplayValue(amount: number): number {
  return amount / USDC_UNIT;
}

/**
 * Convert from display value to smallest unit
 * @param amount - Display value (e.g., 1.0)
 * @returns Amount in smallest unit (e.g., 1000000)
 */
export function toSmallestUnit(amount: number): number {
  return Math.floor(amount * USDC_UNIT);
}

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format currency amount
 * @param amount - Amount in smallest unit (USDC uses 6 decimals, so 1000000 = 1 USDC)
 * @param decimals - Number of decimal places to display (default: 2)
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  // Convert from smallest unit to display value
  const displayValue = toDisplayValue(amount);

  return `$${displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}

/**
 * Format wallet address (truncated)
 * @param address - Full wallet address
 */
export function formatAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format time remaining
 * @param endTime - ISO timestamp of end time
 */
export function formatTimeRemaining(endTime: string): string {
  const now = Date.now();
  const end = new Date(endTime).getTime();
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format relative time (e.g., "2h ago")
 * @param timestamp - ISO timestamp
 */
export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}
