/**
 * Admin Wallet Service
 *
 * Handles admin wallet management and balance tracking.
 */

import { getAllBalances, hasSufficientBalance } from '../blockchain/wallet-balance.service';
import type { WalletBalances } from '../types';

// Admin wallet address from environment
const ADMIN_WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS || process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS || '';

/**
 * Get admin wallet address
 */
export function getAdminWalletAddress(): string {
  return ADMIN_WALLET_ADDRESS;
}

/**
 * Get admin wallet balances
 *
 * Reads from blockchain:
 * - MATIC balance (for gas)
 * - USDC balance (for payouts)
 * - LINK balance (for VRF requests)
 */
export async function getAdminWalletBalances(chainId: number = 137): Promise<WalletBalances> {
  if (!ADMIN_WALLET_ADDRESS) {
    // Return zero balances if admin wallet not configured
    return {
      address: '',
      balances: {
        matic: BigInt(0),
        usdc: BigInt(0),
        link: BigInt(0),
      },
      formatted: {
        matic: '0',
        usdc: '0',
        link: '0',
      },
    };
  }

  return getAllBalances(ADMIN_WALLET_ADDRESS, chainId);
}

/**
 * Check if admin wallet has sufficient balance for operation
 *
 * @param operation Type of operation ('payout' | 'vrf' | 'gas')
 * @param amount Optional amount for operation (in token's smallest unit)
 */
export async function validateSufficientBalance(
  operation: 'payout' | 'vrf' | 'gas',
  amount?: bigint,
  chainId: number = 137
): Promise<boolean> {
  if (!ADMIN_WALLET_ADDRESS) {
    return false;
  }

  // Determine which token to check based on operation
  let token: 'matic' | 'usdc' | 'link';
  let requiredAmount: bigint;

  switch (operation) {
    case 'payout':
      token = 'usdc';
      requiredAmount = amount || BigInt(0);
      break;

    case 'vrf':
      token = 'link';
      // Typical VRF request costs ~0.1 LINK (18 decimals)
      requiredAmount = amount || BigInt(100000000000000000); // 0.1 LINK
      break;

    case 'gas':
      token = 'matic';
      // Estimate gas requirement (e.g., 0.01 MATIC for typical transaction)
      requiredAmount = amount || BigInt(10000000000000000); // 0.01 MATIC
      break;

    default:
      return false;
  }

  return hasSufficientBalance(ADMIN_WALLET_ADDRESS, token, requiredAmount, chainId);
}

/**
 * Get low balance warnings
 *
 * Returns array of warnings for balances below recommended thresholds
 */
export async function getLowBalanceWarnings(chainId: number = 137): Promise<string[]> {
  const warnings: string[] = [];

  if (!ADMIN_WALLET_ADDRESS) {
    warnings.push('Admin wallet address not configured');
    return warnings;
  }

  const balances = await getAdminWalletBalances(chainId);

  // Check MATIC balance (for gas)
  // Recommended: at least 1 MATIC
  const minMatic = BigInt(1000000000000000000); // 1 MATIC
  if (balances.balances.matic < minMatic) {
    warnings.push(
      `Low MATIC balance: ${balances.formatted.matic} MATIC (recommended: 1+ MATIC for gas)`
    );
  }

  // Check LINK balance (for VRF)
  // Recommended: at least 1 LINK
  const minLink = BigInt(1000000000000000000); // 1 LINK
  if (balances.balances.link < minLink) {
    warnings.push(
      `Low LINK balance: ${balances.formatted.link} LINK (recommended: 1+ LINK for VRF requests)`
    );
  }

  // Check USDC balance (for payouts)
  // Recommended: at least $100 USDC
  const minUsdc = BigInt(100000000); // $100 USDC (6 decimals)
  if (balances.balances.usdc < minUsdc) {
    warnings.push(
      `Low USDC balance: $${balances.formatted.usdc} USDC (recommended: $100+ for payouts)`
    );
  }

  return warnings;
}

/**
 * Estimate gas cost for operation
 *
 * Returns estimated gas cost in MATIC
 */
export async function estimateGasCost(
  operation: 'payout' | 'vrf' | 'draw',
  chainId: number = 137
): Promise<{ gasEstimate: bigint; costInMatic: bigint }> {
  // Base gas estimates for different operations
  const gasEstimates: Record<string, bigint> = {
    payout: BigInt(150000), // Typical payout transaction
    vrf: BigInt(200000), // VRF request
    draw: BigInt(300000), // Draw + VRF
  };

  const gasEstimate = gasEstimates[operation] || BigInt(100000);

  // Estimate gas price (approximate for Polygon: 30 gwei)
  const gasPrice = BigInt(30000000000); // 30 gwei

  const costInMatic = gasEstimate * gasPrice;

  return {
    gasEstimate,
    costInMatic,
  };
}

/**
 * Check if admin wallet is configured
 */
export function isAdminWalletConfigured(): boolean {
  return ADMIN_WALLET_ADDRESS.length > 0;
}
