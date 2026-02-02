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
  get PLATFORM_WALLET_ADDRESS() { return requireEnv('PLATFORM_WALLET_ADDRESS'); },
  get OPERATOR_PRIVATE_KEY() { return requireEnv('OPERATOR_PRIVATE_KEY'); },
  get JWT_SECRET() { return requireEnv('JWT_SECRET'); },
  get JWT_ISSUER() { return optionalEnv('JWT_ISSUER', 'fairwin'); },
  get DYNAMODB_TABLE_RAFFLES() { return optionalEnv('DYNAMODB_TABLE_RAFFLES', 'FairWin-Stage-Raffle-Raffles'); },
  get DYNAMODB_TABLE_ENTRIES() { return optionalEnv('DYNAMODB_TABLE_ENTRIES', 'FairWin-Stage-Raffle-Entries'); },
  get DYNAMODB_TABLE_USERS() { return optionalEnv('DYNAMODB_TABLE_USERS', 'FairWin-Stage-Users'); },
  get DYNAMODB_TABLE_WINNERS() { return optionalEnv('DYNAMODB_TABLE_WINNERS', 'FairWin-Stage-Raffle-Winners'); },
  get DYNAMODB_TABLE_PAYOUTS() { return optionalEnv('DYNAMODB_TABLE_PAYOUTS', 'FairWin-Stage-Raffle-Payouts'); },
  get DYNAMODB_TABLE_PLATFORM_STATS() { return optionalEnv('DYNAMODB_TABLE_PLATFORM_STATS', 'FairWin-Stage-PlatformStats'); },
  get DYNAMODB_TABLE_AUDIT_LOG() { return optionalEnv('DYNAMODB_TABLE_AUDIT_LOG', 'FairWin-Stage-AuditLog'); },
  get SOCKET_API_KEY() { return optionalEnv('SOCKET_API_KEY'); },
} as const;

/** Call at server startup to surface missing vars early */
export function validateServerEnv(): void {
  const required = ['ADMIN_WALLET_ADDRESS', 'PLATFORM_WALLET_ADDRESS', 'OPERATOR_PRIVATE_KEY', 'JWT_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.warn(`⚠️  Missing server env vars: ${missing.join(', ')}`);
  }
}
