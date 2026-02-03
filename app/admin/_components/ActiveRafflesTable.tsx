'use client';

import Link from 'next/link';
import { useRaffles } from '@/lib/hooks/raffle/raffle-query.hooks';
import { formatCurrency, formatTimeRemaining } from '@/lib/utils/format';
import { RaffleStatus } from '@/lib/db/models';

function StatusBadge({ status }: { status: string }) {
  const className = status === 'ending' ? 'badge ending' : 'badge active';
  const label = status === 'ending' ? 'Ending' : 'Active';
  return <span className={className}>{label}</span>;
}

export function ActiveRafflesTable() {
  const { data, isLoading } = useRaffles({ status: RaffleStatus.ACTIVE, limit: 4 });

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Active Raffles</span>
          <Link href="/admin/raffles" className="card-link">
            View All →
          </Link>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          Loading...
        </div>
      </div>
    );
  }

  const raffles = data?.raffles || [];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Active Raffles</span>
        <Link href="/admin/raffles" className="card-link">
          View All →
        </Link>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Raffle</th>
              <th>Pool</th>
              <th>Entries</th>
              <th>Time Left</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {raffles.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
                  No active raffles
                </td>
              </tr>
            ) : (
              raffles.map((raffle) => (
                <tr key={raffle.raffleId}>
                  <td>{raffle.title}</td>
                  <td className="table-pool">{formatCurrency(raffle.prizePool)}</td>
                  <td>{raffle.totalEntries?.toLocaleString() || 0}</td>
                  <td className="table-time">{formatTimeRemaining(raffle.endTime)}</td>
                  <td>
                    <StatusBadge status={raffle.displayStatus || raffle.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
