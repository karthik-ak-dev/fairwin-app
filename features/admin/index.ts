// ============================================================================
// Admin Feature — Barrel Exports
// ============================================================================

// Types
export type {
  AdminStats,
  AdminRaffle,
  Payout,
  WalletBalance,
  Transaction,
} from './types';

// Dashboard
export { default as DashboardStats } from './components/DashboardStats';
export { default as ActiveRafflesTable } from './components/ActiveRafflesTable';
export { default as RecentDrawsTable } from './components/RecentDrawsTable';

// Layout
export { default as Sidebar } from './components/Sidebar';

// Raffle Management
export { default as CreateRaffleForm } from './components/CreateRaffleForm';
export { default as RafflePreview } from './components/RafflePreview';
export { default as AdminRaffleStats } from './components/AdminRaffleStats';

// Raffle Detail
export { default as RecentEntriesTable } from './components/RecentEntriesTable';
export { default as EntryDistribution } from './components/EntryDistribution';
export { default as AdminCountdown } from './components/AdminCountdown';
export { default as AdminRaffleInfo } from './components/AdminRaffleInfo';
export { default as ManualDrawBox } from './components/ManualDrawBox';

// Winners & Payouts
export { default as PayoutStats } from './components/PayoutStats';
export { default as PayoutTable } from './components/PayoutTable';

// Operator Wallet
export { default as WalletHero } from './components/WalletHero';
export { default as BalanceAlert } from './components/BalanceAlert';
export { default as WithdrawForm } from './components/WithdrawForm';
export { default as FundGasForm } from './components/FundGasForm';
export { default as WalletTransactions } from './components/WalletTransactions';

// Settings
export { default as ContractConfig } from './components/ContractConfig';
export { default as VRFConfig } from './components/VRFConfig';
export { default as PoolLimits } from './components/PoolLimits';
export { default as OperationsConfig } from './components/OperationsConfig';
export { default as DangerZone } from './components/DangerZone';
