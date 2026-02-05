/**
 * DataTable Component Usage Examples
 *
 * This file shows how to use the DataTable component for all three cases:
 * 1. Withdrawal History (Dashboard)
 * 2. Recent Earnings (Referrals)
 * 3. All Referrals (Referrals)
 */

import { DataTable } from './DataTable';
import { formatCurrency } from '@/lib/utils/format';

// ============================================================================
// Example 1: Withdrawal History (Dashboard Page)
// ============================================================================

type WithdrawalHistory = {
  id: string;
  date: string;
  source: string;
  sourceDetail: string;
  amount: number;
  txHash: string;
  status: string;
};

function WithdrawalHistoryTable({ withdrawalHistory }: { withdrawalHistory: WithdrawalHistory[] }) {
  return (
    <DataTable
      data={withdrawalHistory}
      columns={[
        {
          key: 'date',
          label: 'Date',
          align: 'left',
        },
        {
          key: 'source',
          label: 'Source',
          align: 'left',
          render: (value) => (
            <span className={`${value.includes('Referral') ? 'text-gold' : 'text-accent'}`}>
              {value}
            </span>
          ),
        },
        {
          key: 'sourceDetail',
          label: 'Detail',
          align: 'right',
          render: (value) => <span className="text-xs text-gray-400">{value}</span>,
        },
        {
          key: 'amount',
          label: 'Amount',
          align: 'right',
          render: (value) => <span className="font-bold text-white">{formatCurrency(value)}</span>,
        },
        {
          key: 'status',
          label: 'Status',
          align: 'center',
          render: (value) => (
            <span className="inline-block px-2 py-0.5 text-xs font-bold rounded uppercase bg-green-500/10 border border-green-500/30 text-green-400">
              {value}
            </span>
          ),
        },
      ]}
      maxHeight="max-h-[520px]"
      emptyMessage="No withdrawal history available"
    />
  );
}

// ============================================================================
// Example 2: Recent Earnings (Referrals Page)
// ============================================================================

type RecentEarning = {
  referralName: string;
  level: number;
  amount: number;
  date: string;
};

function RecentEarningsTable({ recentEarnings }: { recentEarnings: RecentEarning[] }) {
  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-orange-500/10 border border-orange-500/30 text-orange-400',
      2: 'bg-orange-400/10 border border-orange-400/30 text-orange-300',
      3: 'bg-orange-300/10 border border-orange-300/30 text-orange-200',
      4: 'bg-orange-200/10 border border-orange-200/30 text-orange-100',
      5: 'bg-orange-100/10 border border-orange-100/30 text-orange-50',
    };
    return colors[level as keyof typeof colors] || colors[1];
  };

  return (
    <DataTable
      data={recentEarnings}
      columns={[
        {
          key: 'referralName',
          label: 'Name',
          align: 'left',
          render: (value) => <span className="text-gray-300">{value}</span>,
        },
        {
          key: 'level',
          label: 'Level',
          align: 'center',
          render: (value) => (
            <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded uppercase ${getLevelColor(value)}`}>
              L{value}
            </span>
          ),
        },
        {
          key: 'amount',
          label: 'Amount',
          align: 'right',
          render: (value) => <span className="font-bold text-gold">{formatCurrency(value)}</span>,
        },
        {
          key: 'date',
          label: 'Date',
          align: 'right',
          render: (value) => <span className="text-gray-400">{value}</span>,
        },
      ]}
      emptyMessage="No recent earnings"
    />
  );
}

// ============================================================================
// Example 3: All Referrals with Search (Referrals Page)
// ============================================================================

type Referral = {
  name: string;
  level: number;
  joinedDate: string;
  staked: number;
  yourEarnings: number;
};

function AllReferralsTable({ allReferrals }: { allReferrals: Referral[] }) {
  const getLevelColor = (level: number) => {
    const colors = {
      1: 'bg-orange-500/10 border border-orange-500/30 text-orange-400',
      2: 'bg-orange-400/10 border border-orange-400/30 text-orange-300',
      3: 'bg-orange-300/10 border border-orange-300/30 text-orange-200',
      4: 'bg-orange-200/10 border border-orange-200/30 text-orange-100',
      5: 'bg-orange-100/10 border border-orange-100/30 text-orange-50',
    };
    return colors[level as keyof typeof colors] || colors[1];
  };

  return (
    <DataTable
      data={allReferrals}
      searchable={true}
      searchField="name"
      searchPlaceholder="Search by name..."
      columns={[
        {
          key: 'name',
          label: 'Name',
          align: 'left',
          render: (value) => <span className="text-gray-300">{value}</span>,
        },
        {
          key: 'level',
          label: 'Level',
          align: 'center',
          render: (value) => (
            <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded uppercase ${getLevelColor(value)}`}>
              L{value}
            </span>
          ),
        },
        {
          key: 'joinedDate',
          label: 'Joined Date',
          align: 'right',
          render: (value) => <span className="text-gray-400">{value}</span>,
        },
        {
          key: 'staked',
          label: 'Staked',
          align: 'right',
          render: (value) => <span className="text-white">{formatCurrency(value)}</span>,
        },
        {
          key: 'yourEarnings',
          label: 'Your Earnings',
          align: 'right',
          render: (value) => <span className="font-bold text-gold">{formatCurrency(value)}</span>,
        },
      ]}
      emptyMessage="No referrals found"
    />
  );
}

// ============================================================================
// Usage in Pages:
// ============================================================================

/**
 * In Dashboard Page:
 *
 * import { DataTable } from '@/components/DataTable';
 *
 * <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
 *   <h2>📜 Withdrawal History</h2>
 *   <WithdrawalHistoryTable withdrawalHistory={withdrawalHistory} />
 * </div>
 */

/**
 * In Referrals Page:
 *
 * import { DataTable } from '@/components/DataTable';
 *
 * // Recent Earnings
 * <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
 *   <h2>💰 Recent Earnings</h2>
 *   <RecentEarningsTable recentEarnings={recentEarnings} />
 * </div>
 *
 * // All Referrals (with search)
 * <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
 *   <h2>👥 All Referrals</h2>
 *   <AllReferralsTable allReferrals={allReferrals} />
 * </div>
 */

export { WithdrawalHistoryTable, RecentEarningsTable, AllReferralsTable };
