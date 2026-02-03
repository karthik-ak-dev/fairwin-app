'use client';

import { useDashboardStats } from '@/lib/hooks/admin/dashboard-stats.hooks';
import { StatCard } from '../_components/StatCard';
import { ActiveRafflesTable } from '../_components/ActiveRafflesTable';
import { RecentWinners } from '../_components/RecentWinners';
import { formatCurrency } from '@/lib/utils/format';

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <>
      <header className="header">
        <h1>Dashboard</h1>
        <div className="header-actions">
          <div className="wallet-status">
            <span className="wallet-dot"></span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              0x1234...5678
            </span>
          </div>
          <button className="btn btn-primary">+ New Raffle</button>
        </div>
      </header>

      <section className="stats-grid">
        {isLoading ? (
          <>
            <StatCard label="Total Value Locked" value="..." highlight accent />
            <StatCard label="Active Raffles" value="..." />
            <StatCard label="Entries Today" value="..." />
            <StatCard label="Revenue (10%)" value="..." />
          </>
        ) : (
          <>
            <StatCard
              label="Total Value Locked"
              value={formatCurrency(stats?.totalValueLocked || 0)}
              highlight
              accent
            />
            <StatCard
              label="Active Raffles"
              value={stats?.activeRafflesCount || 0}
              change={`${stats?.endingSoonCount || 0} ending soon`}
            />
            <StatCard
              label="Entries Today"
              value={stats?.entriesToday || 0}
            />
            <StatCard
              label="Revenue (10%)"
              value={formatCurrency(stats?.revenueThisWeek || 0)}
              change="This week"
            />
          </>
        )}
      </section>

      <section className="two-col">
        <ActiveRafflesTable />
        <RecentWinners />
      </section>
    </>
  );
}
