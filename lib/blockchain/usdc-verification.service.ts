/**
 * USDC Transfer Verification Service
 *
 * Verifies USDC transfer transactions on Polygon blockchain.
 * NO smart contract needed - just verifies ERC20 transfer to platform wallet.
 *
 * Verification Steps:
 * 1. Fetch transaction from blockchain
 * 2. Verify transaction succeeded (status === 'success')
 * 3. Verify transaction called USDC contract's transfer() function
 * 4. Decode transfer data to get recipient and amount
 * 5. Verify recipient is platform wallet
 * 6. Verify amount matches expected value
 * 7. Verify sender matches authenticated user
 */

import { decodeFunctionData, type Address } from 'viem';
import { ERC20_ABI, getPublicClient, getUSDCAddress } from '@/lib/blockchain/client';
import { env } from '@/lib/env';
import { formatUSDC } from '@/shared/utils/format';

/**
 * Platform wallet address that receives USDC payments
 * Update this to your actual platform wallet address
 */
export const PLATFORM_WALLET_ADDRESS = process.env.PLATFORM_WALLET_ADDRESS || env.ADMIN_WALLET_ADDRESS;

export interface USDCTransferVerification {
  verified: true;
  from: string;
  to: string;
  amount: bigint;
  amountFormatted: string; // In USDC (e.g., "10.50")
  transactionHash: string;
  blockNumber: bigint;
  timestamp: bigint;
}

/**
 * Verify a USDC transfer transaction
 *
 * @param transactionHash Transaction hash to verify
 * @param expectedSender Expected wallet address that sent USDC
 * @param expectedAmount Expected amount in USDC smallest unit (6 decimals)
 * @param chainId Chain ID (137 = Polygon Mainnet, 80002 = Amoy testnet)
 * @returns Verification result if valid
 * @throws Error if transaction is invalid or doesn't match expectations
 */
export async function verifyUSDCTransfer(
  transactionHash: string,
  expectedSender: string,
  expectedAmount: bigint,
  chainId: number = env.CHAIN_ID
): Promise<USDCTransferVerification> {
  const client = getPublicClient(chainId);
  const usdcAddress = getUSDCAddress(chainId);

  // Step 1: Fetch transaction
  const transaction = await client.getTransaction({
    hash: transactionHash as `0x${string}`,
  });

  if (!transaction) {
    throw new Error('Transaction not found on blockchain');
  }

  // Step 2: Verify transaction succeeded
  const receipt = await client.getTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  if (!receipt) {
    throw new Error('Transaction receipt not found');
  }

  if (receipt.status !== 'success') {
    throw new Error('Transaction failed on blockchain');
  }

  // Step 3: Verify transaction was sent to USDC contract
  if (transaction.to?.toLowerCase() !== usdcAddress.toLowerCase()) {
    throw new Error(
      `Transaction was not sent to USDC contract. Expected: ${usdcAddress}, Got: ${transaction.to}`
    );
  }

  // Step 4: Decode transaction data to get transfer details
  if (!transaction.input || transaction.input === '0x') {
    throw new Error('Transaction has no input data');
  }

  let decodedData;
  try {
    decodedData = decodeFunctionData({
      abi: ERC20_ABI,
      data: transaction.input,
    });
  } catch (error) {
    throw new Error('Failed to decode transaction data - not a transfer() call');
  }

  if (decodedData.functionName !== 'transfer') {
    throw new Error(`Transaction did not call transfer() function. Called: ${decodedData.functionName}`);
  }

  const [recipient, amount] = decodedData.args;

  // Step 5: Verify recipient is platform wallet
  if (recipient.toLowerCase() !== PLATFORM_WALLET_ADDRESS.toLowerCase()) {
    throw new Error(
      `USDC was not sent to platform wallet. Expected: ${PLATFORM_WALLET_ADDRESS}, Got: ${recipient}`
    );
  }

  // Step 6: Verify amount matches expected
  if (amount !== expectedAmount) {
    throw new Error(
      `Amount mismatch. Expected: ${expectedAmount} (${formatUSDC(expectedAmount)}), Got: ${amount} (${formatUSDC(amount)})`
    );
  }

  // Step 7: Verify sender matches authenticated user
  if (transaction.from.toLowerCase() !== expectedSender.toLowerCase()) {
    throw new Error(
      `Sender mismatch. Expected: ${expectedSender}, Got: ${transaction.from}`
    );
  }

  // Get block timestamp
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });

  return {
    verified: true,
    from: transaction.from,
    to: recipient,
    amount,
    amountFormatted: formatUSDC(amount),
    transactionHash: transaction.hash,
    blockNumber: receipt.blockNumber,
    timestamp: block.timestamp,
  };
}

/**
 * Parse USDC amount from human-readable to smallest unit
 * @param amount Amount as string (e.g., "10.5" or "10")
 * @returns Amount in smallest unit (6 decimals)
 */
export function parseUSDC(amount: string | number): bigint {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return BigInt(Math.round(numAmount * 1_000_000));
}

/**
 * Check if transaction hash is already used
 * Prevents replay attacks
 */
export async function isTransactionUsed(
  transactionHash: string,
  entryRepo: { findByTransactionHash: (hash: string) => Promise<unknown> }
): Promise<boolean> {
  const existing = await entryRepo.findByTransactionHash(transactionHash);
  return !!existing;
}
