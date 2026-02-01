/**
 * Admin Wallet Service
 *
 * Handles admin wallet management and balance tracking.
 */

import { getAllBalances, hasSufficientBalance } from '../blockchain/wallet-balance.service';
import type { WalletBalances } from '../types';
import { env, serverEnv } from '@/lib/env';

/**
 * Get admin wallet address (tries server env first, falls back to client env)
 */
function getAdminAddress(): string {
  try {
    return serverEnv.ADMIN_WALLET_ADDRESS;
  } catch {
    return env.ADMIN_WALLET_ADDRESS || '';
  }
}

/**
 * Get admin wallet address
 */
export function getAdminWalletAddress(): string {
  return getAdminAddress();
}

/**
 * Get admin wallet balances
 *
 * Reads from blockchain:
 * - MATIC balance (for gas)
 * - USDC balance (for payouts)
 * - LINK balance (for VRF requests)
 */
export async function getAdminWalletBalances(chainId: number = env.CHAIN_ID): Promise<WalletBalances> {
  const adminAddress = getAdminAddress();
  if (!adminAddress) {
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

  return getAllBalances(adminAddress, chainId);
}

/**
 * Check if admin wallet has sufficient balance for operation
 *
 * NOTE: Admin wallet does NOT pay winners - contract does automatically.
 * Admin wallet only needs MATIC (gas) and LINK (VRF).
 *
 * @param operation Type of operation ('vrf' | 'gas')
 * @param amount Optional amount for operation (in token's smallest unit)
 */
export async function validateSufficientBalance(
  operation: 'vrf' | 'gas',
  amount?: bigint,
  chainId: number = env.CHAIN_ID
): Promise<boolean> {
  const adminAddress = getAdminAddress();
  if (!adminAddress) {
    return false;
  }

  // Determine which token to check based on operation
  let token: 'matic' | 'link';
  let requiredAmount: bigint;

  switch (operation) {
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

  return hasSufficientBalance(adminAddress, token, requiredAmount, chainId);
}

/**
 * Get low balance warnings
 *
 * Returns array of warnings for balances below recommended thresholds
 */
export async function getLowBalanceWarnings(chainId: number = env.CHAIN_ID): Promise<string[]> {
  const warnings: string[] = [];

  const adminAddress = getAdminAddress();
  if (!adminAddress) {
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

  // NOTE: USDC balance check REMOVED
  // Admin wallet does NOT pay winners - contract pays them automatically
  // Winners are paid from raffle prize pools held in the contract

  return warnings;
}

/**
 * Estimate gas cost for operation
 *
 * Returns estimated gas cost in MATIC
 */
export async function estimateGasCost(
  operation: 'payout' | 'vrf' | 'draw',
  chainId: number = env.CHAIN_ID
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
  return getAdminAddress().length > 0;
}
