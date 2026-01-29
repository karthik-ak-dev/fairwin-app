export interface SocketQuote {
  route: SocketRoute;
  fromAmount: string;
  toAmount: string;
  bridgeFee: string;
  estimatedTime: number;
}

export interface SocketRoute {
  routeId: string;
  fromChainId: number;
  toChainId: number;
  fromToken: string;
  toToken: string;
  bridgeName: string;
}

export interface BridgeStatus {
  status: 'pending' | 'completed' | 'failed';
  sourceTxHash: string;
  destinationTxHash?: string;
}
