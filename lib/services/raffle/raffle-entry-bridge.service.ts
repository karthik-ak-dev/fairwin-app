/**
 * Raffle Entry Bridge Service
 *
 * Handles cross-chain raffle entries using Socket.Tech bridge aggregator.
 * Allows users to enter raffles using tokens from different chains.
 *
 * Flow:
 * 1. User wants to enter raffle on Polygon using USDC from Ethereum
 * 2. Get bridge quote from Socket.Tech
 * 3. User approves source token and executes bridge transaction
 * 4. Backend polls bridge status until completion
 * 5. Once bridged, user enters raffle with bridged USDC
 * 6. Backend verifies entry transaction and records it
 */

import * as socketClient from '@/lib/socket/client';
import { getContractAddress } from '@/lib/blockchain';
import { blockchain } from '@/lib/constants';

/**
 * Supported chains for bridge
 */
export const SUPPORTED_BRIDGE_CHAINS = {
  ETHEREUM: 1,
  POLYGON: blockchain.CHAIN_IDS.POLYGON_MAINNET,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  BSC: 56,
  AVALANCHE: 43114,
} as const;

/**
 * USDC addresses on different chains
 */
export const USDC_ADDRESSES: Record<number, string> = {
  [SUPPORTED_BRIDGE_CHAINS.ETHEREUM]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
  [SUPPORTED_BRIDGE_CHAINS.POLYGON]: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // Native USDC on Polygon
  [SUPPORTED_BRIDGE_CHAINS.ARBITRUM]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
  [SUPPORTED_BRIDGE_CHAINS.OPTIMISM]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC on Optimism
  [SUPPORTED_BRIDGE_CHAINS.BASE]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
  [SUPPORTED_BRIDGE_CHAINS.BSC]: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC on BSC
  [SUPPORTED_BRIDGE_CHAINS.AVALANCHE]: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC on Avalanche
};

/**
 * Get bridge quote for raffle entry
 *
 * Calculates how much source token is needed to get the required USDC on Polygon.
 *
 * @param fromChainId Source chain ID
 * @param fromTokenAddress Source token address (e.g., USDC on Ethereum)
 * @param requiredUSDCAmount Amount of USDC needed on Polygon (in smallest unit, 6 decimals)
 * @param userAddress User's wallet address
 * @returns Bridge quote with route and transaction data
 */
export async function getBridgeQuoteForEntry(
  fromChainId: number,
  fromTokenAddress: string,
  requiredUSDCAmount: string,
  userAddress: string,
  targetChainId: number = blockchain.DEFAULT_CHAIN_ID // Default to Polygon
): Promise<{
  quote: socketClient.SocketQuoteResponse;
  estimatedSourceAmount: string;
  estimatedGasUsd: number;
}> {
  const addresses = getContractAddress(targetChainId);
  const toTokenAddress = addresses.usdc;

  // Get quote from Socket.Tech
  const quote = await socketClient.getQuote({
    fromChainId,
    toChainId: targetChainId,
    fromTokenAddress,
    toTokenAddress,
    fromAmount: requiredUSDCAmount,
    userAddress,
    uniqueRoutesPerBridge: true,
    sort: 'output',
    singleTxOnly: true,
  });

  if (!quote.routes || quote.routes.length === 0) {
    throw new Error(
      `No bridge routes found from chain ${fromChainId} to chain ${targetChainId}`
    );
  }

  const bestRoute = quote.routes[0];

  return {
    quote,
    estimatedSourceAmount: bestRoute.fromAmount,
    estimatedGasUsd: bestRoute.totalGasFeesInUsd,
  };
}

/**
 * Execute bridge transaction for raffle entry
 *
 * Returns transaction data for user to sign and execute on source chain.
 * After execution, user should call waitForBridgeAndEnter() to complete the flow.
 *
 * @param fromChainId Source chain ID
 * @param fromTokenAddress Source token address
 * @param requiredUSDCAmount Amount of USDC needed on destination chain
 * @param userAddress User's wallet address
 * @param targetChainId Target chain ID (default: Polygon)
 * @returns Route and transaction data to be executed
 */
export async function prepareBridgeTransaction(
  fromChainId: number,
  fromTokenAddress: string,
  requiredUSDCAmount: string,
  userAddress: string,
  targetChainId: number = blockchain.DEFAULT_CHAIN_ID
) {
  const addresses = getContractAddress(targetChainId);

  const result = await socketClient.executeRoute({
    fromChainId,
    toChainId: targetChainId,
    fromTokenAddress,
    toTokenAddress: addresses.usdc,
    fromAmount: requiredUSDCAmount,
    userAddress,
    singleTxOnly: true,
  });

  return result;
}

/**
 * Monitor bridge status
 *
 * Polls bridge status until tokens arrive on destination chain.
 * Use this after user executes bridge transaction.
 *
 * @param sourceTxHash Source chain transaction hash
 * @param fromChainId Source chain ID
 * @param toChainId Destination chain ID
 * @returns Final bridge status with destination transaction hash
 */
export async function waitForBridge(
  sourceTxHash: string,
  fromChainId: number,
  toChainId: number = 137
): Promise<socketClient.SocketBridgeStatusResponse> {
  return socketClient.waitForBridgeCompletion(
    sourceTxHash,
    fromChainId,
    toChainId,
    60, // 60 attempts
    5000 // 5 seconds between attempts = 5 min max wait
  );
}

/**
 * Check if bridge is supported for a given chain
 */
export function isBridgeSupported(chainId: number): boolean {
  return chainId in USDC_ADDRESSES;
}

/**
 * Get USDC address for a given chain
 */
export function getUSDCAddress(chainId: number): string | undefined {
  return USDC_ADDRESSES[chainId];
}

/**
 * Estimate total cost for bridge + entry
 *
 * Helps users understand total cost before committing.
 *
 * @param fromChainId Source chain ID
 * @param fromTokenAddress Source token address
 * @param entryPrice Raffle entry price in USDC (smallest unit)
 * @param numEntries Number of entries to purchase
 * @param userAddress User's wallet address
 * @returns Cost breakdown
 */
export async function estimateBridgeCost(
  fromChainId: number,
  fromTokenAddress: string,
  entryPrice: number,
  numEntries: number,
  userAddress: string,
  targetChainId: number = blockchain.DEFAULT_CHAIN_ID
): Promise<{
  totalUSDCNeeded: string;
  estimatedSourceAmount: string;
  estimatedGasUsd: number;
  route: socketClient.SocketRoute;
}> {
  const totalUSDCNeeded = (entryPrice * numEntries).toString();

  const quoteResult = await getBridgeQuoteForEntry(
    fromChainId,
    fromTokenAddress,
    totalUSDCNeeded,
    userAddress,
    targetChainId
  );

  return {
    totalUSDCNeeded,
    estimatedSourceAmount: quoteResult.estimatedSourceAmount,
    estimatedGasUsd: quoteResult.estimatedGasUsd,
    route: quoteResult.quote.routes[0],
  };
}
