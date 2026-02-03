'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRaffleDetails } from '@/lib/hooks/raffle/raffle-query.hooks';
import { usePauseRaffle, useResumeRaffle, useCancelRaffle } from '@/lib/hooks/raffle/raffle-mutation.hooks';
import { RaffleStatus } from '@/lib/db/models';
import { formatCurrency, formatTimeRemaining } from '@/lib/utils/format';

function StatusBadge({ status }: { status: string }) {
  const statusClasses: Record<string, string> = {
    active: 'status-badge active',
    paused: 'status-badge scheduled',
    ending: 'status-badge ending',
    drawing: 'status-badge drawing',
    completed: 'status-badge ended',
    scheduled: 'status-badge scheduled',
    cancelled: 'status-badge ended',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    paused: 'Paused',
    ending: 'Ending',
    drawing: 'Drawing',
    completed: 'Ended',
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
  };

  return (
    <span className={statusClasses[status] || 'status-badge'}>
      {statusLabels[status] || status}
    </span>
  );
}

export default function RaffleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data, isLoading } = useRaffleDetails(id);
  const { mutate: pauseRaffle, isPending: isPausing } = usePauseRaffle();
  const { mutate: resumeRaffle, isPending: isResuming } = useResumeRaffle();
  const { mutate: cancelRaffle, isPending: isCancelling } = useCancelRaffle();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (isLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>
        Loading raffle details...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>
        Raffle not found
      </div>
    );
  }

  const { raffle, recentEntries, entryDistribution, prizeTierBreakdown } = data;
  const isEnded = raffle.status === RaffleStatus.COMPLETED || raffle.status === RaffleStatus.CANCELLED;
  const isPaused = raffle.status === RaffleStatus.PAUSED;
  const isActive = raffle.status === RaffleStatus.ACTIVE;
  const avgPerUser = raffle.totalParticipants > 0
    ? (raffle.totalEntries / raffle.totalParticipants).toFixed(1)
    : '0';

  const handlePause = () => {
    pauseRaffle(id, {
      onError: (error) => {
        alert(`Failed to pause raffle: ${error.message}`);
      }
    });
  };

  const handleResume = () => {
    resumeRaffle(id, {
      onError: (error) => {
        alert(`Failed to resume raffle: ${error.message}`);
      }
    });
  };

  const handleCancel = () => {
    if (!showCancelConfirm) {
      setShowCancelConfirm(true);
      return;
    }

    cancelRaffle(id, {
      onSuccess: () => {
        setShowCancelConfirm(false);
      },
      onError: (error) => {
        alert(`Failed to cancel raffle: ${error.message}`);
        setShowCancelConfirm(false);
      }
    });
  };

  // Group entry distribution into buckets for display
  const distributionBuckets = {
    single: entryDistribution.filter(d => d.entries === 1).reduce((sum, d) => sum + d.userCount, 0),
    small: entryDistribution.filter(d => d.entries >= 2 && d.entries <= 5).reduce((sum, d) => sum + d.userCount, 0),
    medium: entryDistribution.filter(d => d.entries >= 6 && d.entries <= 10).reduce((sum, d) => sum + d.userCount, 0),
    large: entryDistribution.filter(d => d.entries > 10).reduce((sum, d) => sum + d.userCount, 0),
  };

  return (
    <>
      <header className="header">
        <Link href="/admin/raffles" className="header-back">
          ← Back to Raffles
        </Link>
        <div className="header-top">
          <h1>
            🎟️ {raffle.title} <StatusBadge status={raffle.displayStatus || raffle.status} />
          </h1>
          <div className="header-actions">
            {!isEnded && (
              <>
                <button className="btn btn-secondary" disabled>Edit</button>

                {isPaused ? (
                  <button
                    className="btn btn-secondary"
                    onClick={handleResume}
                    disabled={isResuming}
                  >
                    {isResuming ? 'Resuming...' : 'Resume'}
                  </button>
                ) : isActive && (
                  <button
                    className="btn btn-secondary"
                    onClick={handlePause}
                    disabled={isPausing}
                  >
                    {isPausing ? 'Pausing...' : 'Pause'}
                  </button>
                )}

                <button
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {showCancelConfirm ? (isCancelling ? 'Cancelling...' : 'Confirm Cancel?') : 'Cancel'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <section className="stats-row">
        <div className="stat-card highlight">
          <div className="stat-label">Pool</div>
          <div className="stat-value accent">{formatCurrency(raffle.prizePool)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Entries</div>
          <div className="stat-value">{raffle.totalEntries.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Participants</div>
          <div className="stat-value">{raffle.totalParticipants.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg/User</div>
          <div className="stat-value">{avgPerUser}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Winner Gets</div>
          <div className="stat-value accent">{formatCurrency(raffle.winnerPayout)}</div>
        </div>
      </section>

      <section className="two-col">
        <div>
          {/* Recent Entries */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">👥 Recent Entries</span>
              <a href="#" className="card-link">Export CSV →</a>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Entries</th>
                    <th>Total</th>
                    <th>Time</th>
                    <th>TX</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '40px 20px' }}>
                        No entries yet
                      </td>
                    </tr>
                  ) : (
                    recentEntries.map((entry) => (
                      <tr key={entry.entryId}>
                        <td className="table-address">
                          {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                        </td>
                        <td className="table-entries">{entry.numEntries}</td>
                        <td>{formatCurrency(entry.totalPaid)}</td>
                        <td>{formatTimeRemaining(entry.createdAt).replace('left', 'ago')}</td>
                        <td>
                          <a
                            href={`https://polygonscan.com/tx/${entry.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--accent)' }}
                          >
                            View ↗
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Entry Distribution */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">📊 Entry Distribution</span>
            </div>
            <div className="distribution-grid">
              <div className="distribution-item">
                <div className="distribution-value">{distributionBuckets.single}</div>
                <div className="distribution-label">1 entry</div>
              </div>
              <div className="distribution-item">
                <div className="distribution-value">{distributionBuckets.small}</div>
                <div className="distribution-label">2-5 entries</div>
              </div>
              <div className="distribution-item">
                <div className="distribution-value">{distributionBuckets.medium}</div>
                <div className="distribution-label">6-10 entries</div>
              </div>
              <div className="distribution-item">
                <div className="distribution-value">{distributionBuckets.large}</div>
                <div className="distribution-label">10+ entries</div>
              </div>
            </div>
          </div>

          {/* Prize Tier Breakdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">🏆 Prize Breakdown</span>
            </div>
            <div className="prize-tiers">
              {prizeTierBreakdown.map((tier, index) => (
                <div key={index} className="prize-tier">
                  <div className="prize-tier-header">
                    <span className="prize-tier-name">{tier.name}</span>
                    <span className="prize-tier-percentage">{tier.percentage}%</span>
                  </div>
                  <div className="prize-tier-details">
                    <div className="prize-tier-detail">
                      <span className="prize-tier-detail-label">Total Pool:</span>
                      <span className="prize-tier-detail-value">{formatCurrency(tier.totalAmount)}</span>
                    </div>
                    <div className="prize-tier-detail">
                      <span className="prize-tier-detail-label">Winners:</span>
                      <span className="prize-tier-detail-value">{tier.winnerCount}</span>
                    </div>
                    <div className="prize-tier-detail">
                      <span className="prize-tier-detail-label">Per Winner:</span>
                      <span className="prize-tier-detail-value accent">{formatCurrency(tier.amountPerWinner)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Countdown Card */}
          <div className="card countdown-card">
            <div className="countdown-label">
              ⏱ {isEnded ? 'Ended' : 'Time Remaining'}
            </div>
            <div className="countdown-display">
              {formatTimeRemaining(raffle.endTime)}
            </div>
          </div>

          {/* Raffle Details */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '16px' }}>📋 Raffle Details</div>
            <div className="info-row">
              <span className="info-label">Raffle ID</span>
              <span className="info-value mono">#{raffle.raffleId.slice(-6)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Type</span>
              <span className="info-value">{raffle.type.charAt(0).toUpperCase() + raffle.type.slice(1)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Entry Price</span>
              <span className="info-value">{formatCurrency(raffle.entryPrice)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Total Winners</span>
              <span className="info-value">{raffle.winnerCount} winners</span>
            </div>
            <div className="info-row">
              <span className="info-label">Platform Fee</span>
              <span className="info-value">{raffle.platformFeePercent}% ({formatCurrency(raffle.protocolFee)})</span>
            </div>
            <div className="info-row">
              <span className="info-label">Started</span>
              <span className="info-value">
                {new Date(raffle.startTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Ends</span>
              <span className="info-value">
                {new Date(raffle.endTime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Manual Draw Action */}
          {!isEnded && raffle.displayStatus === 'ending' && (
            <div className="action-box">
              <div className="action-box-title">⚡ Manual Draw</div>
              <div className="action-box-desc">
                Trigger draw before scheduled end time. Use only if needed.
              </div>
              <button className="btn btn-warning">Trigger Draw Now</button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
