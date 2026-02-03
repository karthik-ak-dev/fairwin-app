'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRaffles } from '@/lib/hooks/raffle/raffle-query.hooks';
import { RaffleStatus } from '@/lib/db/models';
import { formatCurrency, formatTimeRemaining } from '@/lib/utils/format';

type FilterStatus = 'all' | 'ending' | RaffleStatus;

function StatusBadge({ status }: { status: string }) {
  const statusClasses: Record<string, string> = {
    active: 'badge active',
    ending: 'badge ending',
    drawing: 'badge drawing',
    ended: 'badge ended',
    completed: 'badge ended',
    scheduled: 'badge scheduled',
    cancelled: 'badge ended',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    ending: 'Ending',
    drawing: 'Drawing',
    ended: 'Ended',
    completed: 'Ended',
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
  };

  return (
    <span className={statusClasses[status] || 'badge'}>
      {statusLabels[status] || status}
    </span>
  );
}

export default function RafflesPage() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch ALL raffles (no status filter) to enable client-side filtering and accurate counts
  const { data, isLoading } = useRaffles({
    limit: 100, // Increase limit to get more raffles
  });

  const allRaffles = data?.raffles || [];

  // Apply client-side filtering for status
  let statusFilteredRaffles = allRaffles;

  if (filter === 'ending') {
    statusFilteredRaffles = allRaffles.filter((r) => r.displayStatus === 'ending');
  } else if (filter === RaffleStatus.ACTIVE) {
    statusFilteredRaffles = allRaffles.filter(
      (r) => (r.status === RaffleStatus.ACTIVE && r.displayStatus !== 'ending')
    );
  } else if (filter === RaffleStatus.DRAWING) {
    statusFilteredRaffles = allRaffles.filter((r) => r.status === RaffleStatus.DRAWING);
  } else if (filter === RaffleStatus.COMPLETED) {
    statusFilteredRaffles = allRaffles.filter((r) => r.status === RaffleStatus.COMPLETED);
  } else if (filter === RaffleStatus.SCHEDULED) {
    statusFilteredRaffles = allRaffles.filter((r) => r.status === RaffleStatus.SCHEDULED);
  }
  // If filter === 'all', show all raffles (no filtering)

  // Filter raffles by search query
  const filteredRaffles = searchQuery
    ? statusFilteredRaffles.filter((raffle) =>
        raffle.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        raffle.raffleId.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : statusFilteredRaffles;

  // Count raffles by status for filter buttons (use all raffles for accurate counts)
  const statusCounts = {
    all: allRaffles.length,
    active: allRaffles.filter((r) => r.status === RaffleStatus.ACTIVE && r.displayStatus !== 'ending').length,
    ending: allRaffles.filter((r) => r.displayStatus === 'ending').length,
    drawing: allRaffles.filter((r) => r.status === RaffleStatus.DRAWING).length,
    ended: allRaffles.filter((r) => r.status === RaffleStatus.COMPLETED).length,
    scheduled: allRaffles.filter((r) => r.status === RaffleStatus.SCHEDULED).length,
  };

  return (
    <>
      <header className="header">
        <h1>🎟️ Raffles</h1>
        <Link href="/admin/raffles/create">
          <button className="btn-primary">+ Create Raffle</button>
        </Link>
      </header>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All <span className="count">{statusCounts.all}</span>
        </button>
        <button
          className={`filter-btn ${filter === RaffleStatus.ACTIVE ? 'active' : ''}`}
          onClick={() => setFilter(RaffleStatus.ACTIVE)}
        >
          Active <span className="count">{statusCounts.active}</span>
        </button>
        <button
          className={`filter-btn ${filter === 'ending' ? 'active' : ''}`}
          onClick={() => setFilter('ending' as FilterStatus)}
        >
          Ending Soon <span className="count">{statusCounts.ending}</span>
        </button>
        <button
          className={`filter-btn ${filter === RaffleStatus.DRAWING ? 'active' : ''}`}
          onClick={() => setFilter(RaffleStatus.DRAWING)}
        >
          Drawing <span className="count">{statusCounts.drawing}</span>
        </button>
        <button
          className={`filter-btn ${filter === RaffleStatus.COMPLETED ? 'active' : ''}`}
          onClick={() => setFilter(RaffleStatus.COMPLETED)}
        >
          Ended <span className="count">{statusCounts.ended}</span>
        </button>
        <button
          className={`filter-btn ${filter === RaffleStatus.SCHEDULED ? 'active' : ''}`}
          onClick={() => setFilter(RaffleStatus.SCHEDULED)}
        >
          Scheduled <span className="count">{statusCounts.scheduled}</span>
        </button>
        <input
          type="text"
          className="search-box"
          placeholder="🔍 Search raffles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>
            Loading raffles...
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Raffle</th>
                    <th>Status</th>
                    <th>Pool</th>
                    <th>Entries</th>
                    <th>Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRaffles.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: '60px 20px' }}>
                        {searchQuery
                          ? `No raffles found matching "${searchQuery}"`
                          : 'No raffles found'}
                      </td>
                    </tr>
                  ) : (
                    filteredRaffles.map((raffle) => {
                      const isEnded = raffle.status === RaffleStatus.COMPLETED || raffle.status === RaffleStatus.CANCELLED;
                      const isEnding = raffle.displayStatus === 'ending';
                      const canTriggerDraw = isEnding && Date.now() >= new Date(raffle.endTime).getTime();

                      return (
                        <tr key={raffle.raffleId}>
                          <td>
                            <div className="raffle-name">{raffle.title}</div>
                            <div className="raffle-id">#{raffle.raffleId.slice(-6)}</div>
                          </td>
                          <td>
                            <StatusBadge status={raffle.displayStatus || raffle.status} />
                          </td>
                          <td className="pool-value">{formatCurrency(raffle.prizePool)}</td>
                          <td>{raffle.totalEntries.toLocaleString()}</td>
                          <td className={`time-value ${isEnding ? 'urgent' : ''}`}>
                            {isEnded
                              ? formatTimeRemaining(raffle.endTime).replace('left', 'ago')
                              : formatTimeRemaining(raffle.endTime)}
                          </td>
                          <td>
                            <div className="action-btns">
                              <Link href={`/admin/raffles/${raffle.raffleId}`}>
                                <button className="action-btn">View</button>
                              </Link>
                              {!isEnded && (
                                <button className="action-btn">Edit</button>
                              )}
                              {canTriggerDraw && (
                                <button className="action-btn primary">Trigger Draw</button>
                              )}
                              {isEnded && (
                                <button className="action-btn">Results</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredRaffles.length > 0 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {filteredRaffles.length} of {statusCounts.all} raffles
                </div>
                <div className="pagination-btns">
                  <button className="page-btn" disabled>
                    ← Prev
                  </button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn" disabled>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
