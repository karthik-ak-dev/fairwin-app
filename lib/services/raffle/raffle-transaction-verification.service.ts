/**
 * Transaction Verification Service
 *
 * Verifies blockchain transactions before recording them in database.
 * Prevents fake entries by confirming transaction actually happened on-chain.
 *
 * Verification Steps:
 * 1. Fetch transaction receipt from blockchain
 * 2. Verify transaction succeeded (status === 'success')
 * 3. Verify transaction called the correct contract function
 * 4. Verify transaction emitted expected events
 * 5. Verify event parameters match expected values
 */

import { getPublicClient } from '@wagmi/core';
import { polygon, polygonAmoy } from 'viem/chains';
import { decodeEventLog, type TransactionReceipt } from 'viem';
import { config } from '@/lib/wagmi/config';
import { FAIRWIN_ABI, getContractAddress } from '@/lib/blockchain';
import { blockchain, patterns } from '@/lib/constants';

/**
 * Get public client for reading blockchain data
 */
function getClient(chainId: number = blockchain.DEFAULT_CHAIN_ID) {
  const chain = chainId === blockchain.CHAIN_IDS.POLYGON_MAINNET ? polygon : polygonAmoy;
  return getPublicClient(config, { chainId: chain.id });
}

/**
 * Verify a raffle entry transaction on blockchain
 *
 * @param transactionHash Transaction hash to verify
 * @param expectedWallet Expected wallet address that made the entry
 * @param expectedRaffleId Expected raffle ID
 * @param expectedNumEntries Expected number of entries
 * @param chainId Chain ID (Polygon Mainnet, 80002 = Amoy testnet)
 * @returns Transaction receipt if valid
 * @throws Error if transaction is invalid or doesn't match expectations
 */
export async function verifyEntryTransaction(
  transactionHash: string,
  expectedWallet: string,
  expectedRaffleId: string,
  expectedNumEntries: number,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<{ receipt: TransactionReceipt; blockNumber: number }> {
  const client = getClient(chainId);
  const addresses = getContractAddress(chainId);

  // Step 1: Fetch transaction receipt
  const receipt = await client.getTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  if (!receipt) {
    throw new Error('Transaction not found on blockchain');
  }

  // Step 2: Verify transaction succeeded
  if (receipt.status !== 'success') {
    throw new Error('Transaction failed on blockchain');
  }

  // Step 3: Verify transaction was sent to raffle contract
  if (receipt.to?.toLowerCase() !== addresses.raffle.toLowerCase()) {
    throw new Error('Transaction was not sent to raffle contract');
  }

  // Step 4: Find and decode EntrySubmitted event
  const entryLog = receipt.logs.find((log) => {
    try {
      const decoded = decodeEventLog({
        abi: FAIRWIN_ABI,
        data: log.data,
        topics: log.topics,
      });
      return decoded.eventName === 'EntrySubmitted';
    } catch {
      return false;
    }
  });

  if (!entryLog) {
    throw new Error('Transaction did not emit EntrySubmitted event');
  }

  // Step 5: Decode and verify event parameters
  const decoded = decodeEventLog({
    abi: FAIRWIN_ABI,
    data: entryLog.data,
    topics: entryLog.topics,
  });

  const args = decoded.args as unknown as {
    raffleId: bigint;
    player: string;
    numEntries: bigint;
    totalPaid: bigint;
  };

  // Verify raffle ID matches
  if (args.raffleId.toString() !== expectedRaffleId) {
    throw new Error(
      `Transaction raffle ID mismatch: expected ${expectedRaffleId}, got ${args.raffleId}`
    );
  }

  // Verify wallet address matches
  if (args.player.toLowerCase() !== expectedWallet.toLowerCase()) {
    throw new Error(
      `Transaction wallet mismatch: expected ${expectedWallet}, got ${args.player}`
    );
  }

  // Verify number of entries matches
  if (Number(args.numEntries) !== expectedNumEntries) {
    throw new Error(
      `Transaction entry count mismatch: expected ${expectedNumEntries}, got ${args.numEntries}`
    );
  }

  return {
    receipt,
    blockNumber: Number(receipt.blockNumber),
  };
}

/**
 * Verify a payout transaction on blockchain
 *
 * @param transactionHash Transaction hash to verify
 * @param expectedRaffleId Expected raffle ID
 * @param chainId Chain ID
 * @returns Transaction receipt if valid
 * @throws Error if transaction is invalid
 */
export async function verifyPayoutTransaction(
  transactionHash: string,
  expectedRaffleId: string,
  chainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<{ receipt: TransactionReceipt; blockNumber: number }> {
  const client = getClient(chainId);
  const addresses = getContractAddress(chainId);

  const receipt = await client.getTransactionReceipt({
    hash: transactionHash as `0x${string}`,
  });

  if (!receipt) {
    throw new Error('Transaction not found on blockchain');
  }

  if (receipt.status !== 'success') {
    throw new Error('Transaction failed on blockchain');
  }

  if (receipt.to?.toLowerCase() !== addresses.raffle.toLowerCase()) {
    throw new Error('Transaction was not sent to raffle contract');
  }

  // Find WinnersSelected event
  const winnerLog = receipt.logs.find((log) => {
    try {
      const decoded = decodeEventLog({
        abi: FAIRWIN_ABI,
        data: log.data,
        topics: log.topics,
      });
      return decoded.eventName === 'WinnersSelected';
    } catch {
      return false;
    }
  });

  if (!winnerLog) {
    throw new Error('Transaction did not emit WinnersSelected event');
  }

  const decoded = decodeEventLog({
    abi: FAIRWIN_ABI,
    data: winnerLog.data,
    topics: winnerLog.topics,
  });

  const args = decoded.args as unknown as {
    raffleId: bigint;
  };

  if (args.raffleId.toString() !== expectedRaffleId) {
    throw new Error(
      `Transaction raffle ID mismatch: expected ${expectedRaffleId}, got ${args.raffleId}`
    );
  }

  return {
    receipt,
    blockNumber: Number(receipt.blockNumber),
  };
}

/**
 * Check if a transaction hash is valid format
 */
export function isValidTransactionHash(hash: string): boolean {
  return patterns.TRANSACTION_HASH.test(hash);
}
