function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}. Add it to .env.local`);
  return value;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

/** Client-side environment (NEXT_PUBLIC_ vars) */
export const env = {
  CONTRACT_ADDRESS: optionalEnv('NEXT_PUBLIC_CONTRACT_ADDRESS', '0x0000000000000000000000000000000000000000'),
  USDC_CONTRACT: optionalEnv('NEXT_PUBLIC_USDC_CONTRACT', '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'),
  CHAIN_ID: parseInt(optionalEnv('NEXT_PUBLIC_CHAIN_ID', '137'), 10),
  RPC_URL: optionalEnv('NEXT_PUBLIC_RPC_URL', 'https://polygon-rpc.com'),
  WALLETCONNECT_PROJECT_ID: optionalEnv('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID'),
  ADMIN_WALLET_ADDRESS: optionalEnv('NEXT_PUBLIC_ADMIN_WALLET_ADDRESS'),
  APP_URL: optionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  POLYGONSCAN_URL: optionalEnv('NEXT_PUBLIC_POLYGONSCAN_URL', 'https://polygonscan.com'),
} as const;

/** Server-only environment (lazy getters — only evaluated when accessed) */
export const serverEnv = {
  get AWS_REGION() { return optionalEnv('AWS_REGION', 'ap-south-1'); },
  get AWS_ACCESS_KEY_ID() { return optionalEnv('AWS_ACCESS_KEY_ID'); },
  get AWS_SECRET_ACCESS_KEY() { return optionalEnv('AWS_SECRET_ACCESS_KEY'); },
  get ADMIN_WALLET_ADDRESS() { return requireEnv('ADMIN_WALLET_ADDRESS'); },
  get VRF_SUBSCRIPTION_ID() { return requireEnv('VRF_SUBSCRIPTION_ID'); },
  get VRF_COORDINATOR() { return optionalEnv('VRF_COORDINATOR', '0xAE975071Be8F8eE67addBC1A82488F1C24858067'); },
  get VRF_KEY_HASH() { return optionalEnv('VRF_KEY_HASH', '0xcc294a196eeeb44da2888d17c0625cc88d70d9760a69d58d853ba6581a9ab0cd'); },
  get SOCKET_API_KEY() { return optionalEnv('SOCKET_API_KEY'); },
  get SECRETS_OPERATOR_KEY_NAME() { return optionalEnv('SECRETS_OPERATOR_KEY_NAME', 'fairwin/operator-private-key'); },
  get JWT_SECRET() { return requireEnv('JWT_SECRET'); },
  get JWT_ISSUER() { return optionalEnv('JWT_ISSUER', 'fairwin'); },
  get EVENTBRIDGE_API_KEY() { return optionalEnv('EVENTBRIDGE_API_KEY'); },
  get DYNAMODB_TABLE_RAFFLES() { return optionalEnv('DYNAMODB_TABLE_RAFFLES', 'FairWin-Stage-Raffle-Raffles'); },
  get DYNAMODB_TABLE_ENTRIES() { return optionalEnv('DYNAMODB_TABLE_ENTRIES', 'FairWin-Stage-Raffle-Entries'); },
  get DYNAMODB_TABLE_USERS() { return optionalEnv('DYNAMODB_TABLE_USERS', 'FairWin-Stage-Users'); },
  get DYNAMODB_TABLE_WINNERS() { return optionalEnv('DYNAMODB_TABLE_WINNERS', 'FairWin-Stage-Raffle-Winners'); },
  get DYNAMODB_TABLE_PAYOUTS() { return optionalEnv('DYNAMODB_TABLE_PAYOUTS', 'FairWin-Stage-Raffle-Payouts'); },
  get DYNAMODB_TABLE_PLATFORM_STATS() { return optionalEnv('DYNAMODB_TABLE_PLATFORM_STATS', 'FairWin-Stage-PlatformStats'); },
} as const;

/** Call at server startup to surface missing vars early */
export function validateServerEnv(): void {
  const required = ['ADMIN_WALLET_ADDRESS', 'JWT_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.warn(`⚠️  Missing server env vars: ${missing.join(', ')}`);
  }
}
