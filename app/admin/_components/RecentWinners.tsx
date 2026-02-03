'use client';

import Link from 'next/link';
import { useWinners } from '@/lib/hooks/raffle/raffle-query.hooks';
import { formatCurrency, formatAddress, formatRelativeTime } from '@/lib/utils/format';

export function RecentWinners() {
  const { data, isLoading } = useWinners({ raffleId: 'all', limit: 4 });

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Winners</span>
          <Link href="/admin/winners" className="card-link">
            View All →
          </Link>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          Loading...
        </div>
      </div>
    );
  }

  const winners = data?.winners || [];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Recent Winners</span>
        <Link href="/winners" className="card-link">
          View All →
        </Link>
      </div>
      {winners.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
          No winners yet
        </div>
      ) : (
        winners.map((winner) => (
          <div key={winner.winnerId} className="winner-item">
            <span className="winner-icon">🏆</span>
            <div className="winner-info">
              <div className="winner-raffle">Raffle #{winner.raffleId.slice(-6)}</div>
              <div className="winner-address">{formatAddress(winner.walletAddress)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="winner-amount">{formatCurrency(winner.prize)}</div>
              <div className="winner-time">{formatRelativeTime(winner.createdAt)}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
