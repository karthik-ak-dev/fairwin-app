/**
 * Admin Fees Service
 *
 * Handles protocol fee withdrawal and tracking.
 * Admin revenue comes from platform fees collected on each raffle.
 * Contract tracks fees automatically - we just read and withdraw them.
 *
 * Fee Flow:
 * 1. User enters raffle, pays entry fee
 * 2. Contract splits fee: 90% to prize pool, 10% to platform
 * 3. Platform fees accumulate in contract's `protocolFeesCollected`
 * 4. Admin calls withdrawFees() to claim revenue
 * 5. USDC transferred from contract to admin wallet
 */

import { withdrawProtocolFees } from '../blockchain/contract-write.service';
import { getProtocolFeesCollected } from '../blockchain/contract-read.service';

/**
 * Fee withdrawal result
 */
export interface FeeWithdrawal {
  transactionHash: string;
  amount: bigint;
  recipient: string;
  timestamp: number;
}

/**
 * Get available fees for withdrawal
 *
 * Reads from contract's `protocolFeesCollected` variable.
 * This is the source of truth for how much admin can withdraw.
 *
 * @param chainId Chain ID (137 for Polygon, 80002 for Amoy testnet)
 * @returns Total fees collected in USDC (smallest unit, 6 decimals)
 *
 * @example
 * const fees = await getAvailableFees(137);
 * // Returns: BigInt(100000000) = $100 USDC
 */
export async function getAvailableFees(chainId: number = 137): Promise<bigint> {
  return await getProtocolFeesCollected(chainId);
}

/**
 * Withdraw protocol fees to recipient address
 *
 * Transfers accumulated platform fees from contract to admin wallet.
 * This is admin's revenue from the platform.
 *
 * Security:
 * - Only contract owner (admin) can call withdrawFees()
 * - Admin can ONLY withdraw fees, not active raffle pools
 * - Contract enforces this separation on-chain
 *
 * @param recipient Address to receive the fees (usually admin wallet)
 * @param amount Amount to withdraw in USDC (smallest unit, 6 decimals)
 * @param chainId Chain ID
 * @returns Withdrawal details including transaction hash
 * @throws Error if no fees available or withdrawal fails
 *
 * @example
 * // Withdraw $100 USDC to admin wallet
 * const result = await withdrawFees(
 *   '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   BigInt(100_000_000),
 *   137
 * );
 * console.log(`Withdrew $${Number(result.amount) / 1_000_000} USDC`);
 */
export async function withdrawFees(
  recipient: string,
  amount: bigint,
  chainId: number = 137
): Promise<FeeWithdrawal> {
  // Verify fees available
  const available = await getAvailableFees(chainId);

  if (available === BigInt(0)) {
    throw new Error('No fees available for withdrawal');
  }

  if (amount > available) {
    throw new Error(
      `Requested amount (${amount}) exceeds available fees (${available})`
    );
  }

  // Execute withdrawal on-chain
  const result = await withdrawProtocolFees(recipient, amount, chainId);

  return {
    transactionHash: result.transactionHash,
    amount: result.amount,
    recipient,
    timestamp: Date.now(),
  };
}

/**
 * Withdraw ALL available protocol fees
 *
 * Convenience function to withdraw everything at once.
 *
 * @param recipient Address to receive the fees
 * @param chainId Chain ID
 * @returns Withdrawal details
 */
export async function withdrawAllFees(
  recipient: string,
  chainId: number = 137
): Promise<FeeWithdrawal> {
  const available = await getAvailableFees(chainId);

  if (available === BigInt(0)) {
    throw new Error('No fees available for withdrawal');
  }

  return await withdrawFees(recipient, available, chainId);
}

/**
 * Format fees for display
 *
 * Converts bigint USDC (6 decimals) to human-readable string.
 *
 * @param fees Fees in smallest unit (6 decimals)
 * @returns Formatted string (e.g., "$1,234.56")
 */
export function formatFees(fees: bigint): string {
  const dollars = Number(fees) / 1_000_000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Get withdrawal history from blockchain events
 *
 * Queries FeesWithdrawn events from contract to build withdrawal history.
 * Useful for accounting and reconciliation.
 *
 * @param chainId Chain ID
 * @returns Array of past withdrawals
 *
 * @todo Implement event querying
 */
export async function getWithdrawalHistory(
  chainId: number = 137
): Promise<FeeWithdrawal[]> {
  // TODO: Query FeesWithdrawn events from contract
  // event FeesWithdrawn(address indexed to, uint256 amount)
  // Return array of past withdrawals for admin dashboard
  return [];
}
