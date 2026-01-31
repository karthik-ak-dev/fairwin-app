const SOCKET_BASE = 'https://api.socket.tech/v2';
const API_KEY = process.env.SOCKET_API_KEY || '';

/**
 * Socket.Tech API Response Types
 */
export interface SocketQuoteResponse {
  routes: SocketRoute[];
  fromChainId: number;
  toChainId: number;
  fromAsset: {
    address: string;
    symbol: string;
    decimals: number;
  };
  toAsset: {
    address: string;
    symbol: string;
    decimals: number;
  };
}

export interface SocketRoute {
  routeId: string;
  fromAmount: string;
  toAmount: string;
  totalGasFeesInUsd: number;
  userTxs: SocketUserTx[];
  recipient: string;
  totalUserTx: number;
}

export interface SocketUserTx {
  userTxType: 'fund-movr' | 'dex-swap' | 'claim';
  txType: 'eth_sendTransaction' | 'eth_sign';
  chainId: number;
  toAmount: string;
  toAsset: {
    address: string;
    symbol: string;
    decimals: number;
  };
  stepCount: number;
  routePath: string;
  sender: string;
  approvalData: {
    minimumApprovalAmount: string;
    approvalTokenAddress: string;
    allowanceTarget: string;
    owner: string;
  } | null;
  steps: SocketStep[];
  gasFees: {
    gasAmount: string;
    gasLimit: number;
    asset: {
      symbol: string;
      decimals: number;
    };
    feesInUsd: number;
  };
}

export interface SocketStep {
  type: string;
  protocol: {
    name: string;
    displayName: string;
    icon: string;
  };
  chainId: number;
  fromAsset: {
    address: string;
    symbol: string;
    decimals: number;
  };
  toAsset: {
    address: string;
    symbol: string;
    decimals: number;
  };
  fromAmount: string;
  toAmount: string;
}

export interface SocketBuildTxResponse {
  txType: string;
  txData: string;
  txTarget: string;
  chainId: number;
  userTxIndex: number;
  value: string;
  totalUserTx: number;
  approvalData: {
    minimumApprovalAmount: string;
    approvalTokenAddress: string;
    allowanceTarget: string;
    owner: string;
  } | null;
}

export interface SocketBridgeStatusResponse {
  sourceTxStatus: 'PENDING' | 'COMPLETED' | 'FAILED';
  destinationTxStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'NOT_FOUND';
  fromChainId: number;
  toChainId: number;
  sourceTxHash: string;
  destinationTxHash?: string;
  refuel?: {
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    txHash?: string;
  };
}

async function socketFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${SOCKET_BASE}${endpoint}`, {
    ...options,
    headers: {
      'API-KEY': API_KEY,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Socket API error: ${res.status}`);
  const data = await res.json();
  return data.result;
}

/**
 * Get best route for cross-chain bridge/swap
 *
 * Finds the optimal route for bridging tokens from source chain to destination chain.
 * Returns multiple route options ranked by cost and speed.
 *
 * @param params Bridge parameters
 * @returns Quote with available routes
 */
export async function getQuote(params: {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;
  userAddress: string;
  uniqueRoutesPerBridge?: boolean;
  sort?: 'output' | 'gas' | 'time';
  singleTxOnly?: boolean;
}): Promise<SocketQuoteResponse> {
  const qs = new URLSearchParams(
    Object.entries(params).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: String(v) }),
      {} as Record<string, string>,
    ),
  );
  return socketFetch<SocketQuoteResponse>(`/quote?${qs}`);
}

/**
 * Build transaction data for route execution
 *
 * Converts a route into executable transaction data that can be signed and sent.
 *
 * @param route Selected route from getQuote
 * @returns Transaction data ready to be executed
 */
export async function buildTx(route: SocketRoute): Promise<SocketBuildTxResponse> {
  return socketFetch<SocketBuildTxResponse>('/build-tx', {
    method: 'POST',
    body: JSON.stringify({ route }),
  });
}

/**
 * Execute a Socket.Tech route
 *
 * Flow:
 * 1. Get quote with available routes
 * 2. Select best route (first route is usually optimal)
 * 3. Build transaction data
 * 4. Return transaction data for user to sign and execute
 *
 * Note: This function does NOT execute the transaction - it returns the data
 * for the client to sign and broadcast using their wallet.
 *
 * @param params Bridge parameters
 * @returns Transaction data to be signed by user's wallet
 */
export async function executeRoute(params: {
  fromChainId: number;
  toChainId: number;
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string;
  userAddress: string;
  singleTxOnly?: boolean;
}): Promise<{
  route: SocketRoute;
  txData: SocketBuildTxResponse;
}> {
  // Step 1: Get quote
  const quote = await getQuote({
    ...params,
    uniqueRoutesPerBridge: true,
    sort: 'output', // Optimize for best output amount
    singleTxOnly: params.singleTxOnly ?? true, // Prefer single-tx routes for UX
  });

  if (!quote.routes || quote.routes.length === 0) {
    throw new Error('No routes found for the given parameters');
  }

  // Step 2: Select best route (first route is optimal based on sort)
  const bestRoute = quote.routes[0];

  // Step 3: Build transaction
  const txData = await buildTx(bestRoute);

  return {
    route: bestRoute,
    txData,
  };
}

/**
 * Check bridge transaction status
 *
 * Polls the bridge status to determine if tokens have been bridged successfully.
 *
 * @param transactionHash Source chain transaction hash
 * @param fromChainId Source chain ID
 * @param toChainId Destination chain ID
 * @returns Bridge status
 */
export async function getBridgeStatus(
  transactionHash: string,
  fromChainId: number,
  toChainId: number
): Promise<SocketBridgeStatusResponse> {
  const qs = new URLSearchParams({
    transactionHash,
    fromChainId: String(fromChainId),
    toChainId: String(toChainId),
  });
  return socketFetch<SocketBridgeStatusResponse>(`/bridge-status?${qs}`);
}

/**
 * Wait for bridge completion with polling
 *
 * Polls bridge status until tokens arrive on destination chain or timeout.
 *
 * @param sourceTxHash Source chain transaction hash
 * @param fromChainId Source chain ID
 * @param toChainId Destination chain ID
 * @param maxAttempts Maximum polling attempts (default: 60)
 * @param intervalMs Polling interval in milliseconds (default: 5000)
 * @returns Final bridge status
 * @throws Error if bridge fails or times out
 */
export async function waitForBridgeCompletion(
  sourceTxHash: string,
  fromChainId: number,
  toChainId: number,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<SocketBridgeStatusResponse> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getBridgeStatus(sourceTxHash, fromChainId, toChainId);

    // Check if completed
    if (status.destinationTxStatus === 'COMPLETED') {
      return status;
    }

    // Check if failed
    if (
      status.sourceTxStatus === 'FAILED' ||
      status.destinationTxStatus === 'FAILED'
    ) {
      throw new Error(
        `Bridge transaction failed: source=${status.sourceTxStatus}, dest=${status.destinationTxStatus}`
      );
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error(
    `Bridge timeout after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)`
  );
}
