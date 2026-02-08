'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { useAuth } from '@/lib/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { DataTable } from '@/components/DataTable';
import { ShareReferralLink } from '@/components/ShareReferralLink';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { stats, stakes, referrals, withdrawal, withdrawalHistory, referralLink } = useDashboard();
  const { user } = useAuth();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawWallet, setWithdrawWallet] = useState('');
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  // Clean up referral cookie after successful login
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      // Remove referral code from localStorage and cookie
      localStorage.removeItem('pendingReferralCode');
      document.cookie = 'pendingReferralCode=; path=/; max-age=0';
    }
  }, [user]);

  const handleWithdrawClick = () => {
    if (withdrawal.isWithdrawalAvailable) {
      setShowWithdrawModal(true);
    }
  };

  const handleWithdrawSubmit = async () => {
    // Validate BSC wallet address format
    const bscAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!withdrawWallet || !bscAddressRegex.test(withdrawWallet)) {
      toast.error('Please enter a valid BSC wallet address (0x + 40 hex characters)');
      return;
    }

    setIsProcessingWithdraw(true);

    try {
      // Call withdrawal API
      const response = await fetch('/api/withdrawals/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: withdrawal.availableAmount,
          walletAddress: withdrawWallet,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create withdrawal');
      }

      toast.success(`Withdrawal request submitted successfully! ${formatCurrency(withdrawal.availableAmount)} will be sent to ${withdrawWallet.slice(0, 10)}... on the 1st of next month.`);

      setShowWithdrawModal(false);
      setWithdrawWallet('');

      // Refresh dashboard data
      window.location.reload();
    } catch (error: any) {
      toast.error(`Withdrawal failed: ${error.message}`);
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Navigation />

      {/* Page Header */}
      <header className="pt-24 sm:pt-28 pb-6 sm:pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2">Your Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-400">Track your stakes, rewards, and referrals</p>
            </div>
            <Link
              href="/stake"
              className="px-5 sm:px-7 py-2.5 sm:py-3.5 bg-accent text-black font-bold text-xs sm:text-sm rounded-lg uppercase tracking-wide hover:scale-105 transition-transform whitespace-nowrap"
            >
              + Stake More
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-10">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-accent hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Total Staked</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-4xl font-black mb-1">{formatCurrency(stats.totalStaked)}</div>
            <div className="text-sm text-gray-400">Across {stats.activeStakesCount} active stakes</div>
          </div>

          <div className="bg-gradient-to-br from-accent/10 to-accent/2 border border-accent/30 rounded-2xl p-6 hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Earned to Date</span>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-4xl font-black text-accent mb-1">{formatCurrency(stats.earnedToDate)}</div>
            <div className="text-sm text-gray-400">8% monthly rate</div>
          </div>

          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 hover:border-accent hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Referral Earnings</span>
              <span className="text-2xl">🤝</span>
            </div>
            <div className="text-4xl font-black mb-1">{formatCurrency(stats.referralEarnings)}</div>
            <div className="text-sm text-gray-400">From {stats.totalReferrals} referrals</div>
          </div>

          <div className="bg-gradient-to-br from-accent/10 to-accent/2 border border-accent/30 rounded-2xl p-6 hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Available Now</span>
              <span className="text-2xl">💸</span>
            </div>
            <div className="text-4xl font-black text-accent mb-1">{formatCurrency(stats.availableNow)}</div>
            <div className="text-sm text-gray-400">Ready to withdraw</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
          {/* Left Column */}
          <div>
            {/* Your Stakes Section */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8 mb-6 lg:mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  💎 Your Stakes
                </h2>
                <span className="text-sm text-gray-400">
                  {stakes.filter((s: any) => s.status === 'Active').length} Active
                  {stakes.filter((s: any) => s.status === 'Verifying').length > 0 &&
                    `, ${stakes.filter((s: any) => s.status === 'Verifying').length} Verifying`
                  }
                </span>
              </div>

              <div className="space-y-5">
                {stakes.map((stake: any) => {
                  const progress = (stake.monthsElapsed / stake.totalMonths) * 100;
                  const isVerifying = stake.status === 'Verifying';

                  return (
                    <div
                      key={stake.id}
                      className={`bg-white/[0.02] border rounded-2xl p-4 sm:p-6 transition-all ${
                        isVerifying
                          ? 'border-yellow-500/30 hover:border-yellow-500/50'
                          : 'border-white/8 hover:border-accent hover:bg-white/[0.04]'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4 sm:mb-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-sm sm:text-base font-bold text-gray-400">
                            Stake #{stake.id.slice(-8)}
                          </span>
                          <span className="text-2xl sm:text-3xl font-black text-accent">{formatCurrency(stake.amount)}</span>
                        </div>
                        <span className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide ${
                          isVerifying
                            ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 animate-pulse'
                            : 'bg-accent/10 border border-accent/30 text-accent'
                        }`}>
                          {isVerifying && '⏳ '}
                          {stake.status}
                        </span>
                      </div>

                      {/* Verifying Notice or Metrics Grid */}
                      {isVerifying ? (
                        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">⏳</span>
                            <div>
                              <div className="text-sm font-bold text-yellow-400 mb-1">
                                Transaction Verification in Progress
                              </div>
                              <div className="text-xs text-gray-400 mb-2">
                                We're verifying your blockchain transaction. This usually takes 5-10 minutes.
                              </div>
                              {stake.txHash && (
                                <div className="text-xs text-gray-500 font-mono">
                                  TX: {stake.txHash.slice(0, 20)}...{stake.txHash.slice(-10)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Metrics Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-4">
                            <div className="text-center">
                              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Daily</div>
                              <div className="text-sm sm:text-base font-bold">{formatCurrency(stake.dailyEarning)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Monthly</div>
                              <div className="text-sm sm:text-base font-bold text-accent">{formatCurrency(stake.monthlyEarning)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Earned</div>
                              <div className="text-sm sm:text-base font-bold text-accent">{formatCurrency(stake.totalEarned)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Progress</div>
                              <div className="text-sm sm:text-base font-bold">{stake.monthsElapsed}/{stake.totalMonths}m</div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Progress Bar - Only for active stakes */}
                      {!isVerifying && (
                        <div className="mb-3 sm:mb-4">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <span>{progress.toFixed(0)}% Complete</span>
                            <span>{stake.totalMonths - stake.monthsElapsed} months remaining</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-accent to-green-400 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-white/8">
                        <span className="text-xs text-gray-400">
                          {isVerifying ? 'Submitted recently' : `Started ${stake.startDate}`}
                        </span>
                        {!isVerifying && (
                          <span className="text-xs sm:text-sm font-bold text-accent">Next reward: {stake.nextRewardDate}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Referral Overview */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                🤝 Referral Network
              </h2>

              {/* Total Earnings */}
              <div className="bg-gradient-to-br from-gold/10 to-gold/2 border border-gold/30 rounded-xl p-6 mb-6 text-center">
                <div className="text-5xl font-black text-gold mb-2">{formatCurrency(referrals.totalEarnings)}</div>
                <div className="text-sm text-gray-400">Total Referral Earnings</div>
              </div>

              {/* Levels Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                {referrals.levels.map((level: any) => (
                  <div key={level.level} className="bg-white/[0.02] border border-white/8 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Level {level.level}</div>
                    <div className="text-2xl font-extrabold text-gold mb-1">{level.count}</div>
                    <div className="text-xs text-gray-400">{level.rate}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div>
            {/* Withdrawal Card */}
            <div className="bg-gradient-to-br from-accent/10 to-accent/2 border border-accent/30 rounded-2xl p-6 sm:p-8 mb-6">
              <h3 className="text-lg font-extrabold mb-6">💸 Withdrawal</h3>

              {/* Countdown/Available */}
              <div className="text-center mb-6">
                {withdrawal.isWithdrawalAvailable ? (
                  <>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Available Now</div>
                    <div className="text-5xl font-black text-accent leading-none mb-2">
                      {formatCurrency(withdrawal.availableAmount)}
                    </div>
                    <div className="text-sm text-gray-400">Ready to withdraw</div>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Next Withdrawal</div>
                    <div className="text-5xl font-black text-accent leading-none mb-2">{withdrawal.daysUntilWithdrawal}d</div>
                    <div className="text-sm text-gray-400">{withdrawal.nextWithdrawalDate}</div>
                  </>
                )}
              </div>

              <button
                onClick={handleWithdrawClick}
                disabled={!withdrawal.isWithdrawalAvailable}
                className={`w-full py-4 rounded-xl font-extrabold text-base uppercase tracking-wide transition-transform ${
                  withdrawal.isWithdrawalAvailable
                    ? 'bg-accent text-black hover:scale-[1.02]'
                    : 'bg-gray-600 text-gray-400 opacity-30 cursor-not-allowed'
                }`}
              >
                Withdraw Now →
              </button>

              {/* Breakdown */}
              <div className="mt-5 p-5 bg-white/[0.02] border border-white/8 rounded-xl space-y-3">
                {/* Per-Stake Rewards */}
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Stake Rewards</div>
                  {withdrawal.breakdown.stakeRewards.map((stake: any, index: number) => (
                    <div key={stake.stakeId} className="flex justify-between items-center py-1.5 text-sm pl-2">
                      <span className="text-gray-400">Stake #{index + 1} ({formatCurrency(stake.amount)})</span>
                      <span className="font-bold text-accent">{formatCurrency(stake.reward)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 text-sm border-t border-white/8 mt-2 pt-2">
                    <span className="text-gray-300 font-semibold">Total Stake Rewards</span>
                    <span className="font-bold text-accent">{formatCurrency(withdrawal.breakdown.totalStakeRewards)}</span>
                  </div>
                </div>

                {/* Referral Commissions */}
                <div className="flex justify-between items-center py-2 text-sm border-t border-white/8 pt-3">
                  <span className="text-gray-300 font-semibold">Referral Commissions</span>
                  <span className="font-bold text-accent">{formatCurrency(withdrawal.breakdown.referralCommissions)}</span>
                </div>
              </div>
            </div>

            {/* Referral Link Card */}
            <ShareReferralLink referralLink={referralLink} />
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="mt-8 sm:mt-10">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">📜</span>
              <h2 className="text-xl font-extrabold">Withdrawal History</h2>
            </div>

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
          </div>
        </div>
      </main>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-bg border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-extrabold">Confirm Withdrawal</h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Withdrawal Summary */}
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-5 mb-6">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-400 mb-2">Total Withdrawal Amount</div>
                <div className="text-4xl font-black text-accent">{formatCurrency(withdrawal.availableAmount)}</div>
              </div>

              <div className="space-y-2 text-sm">
                {/* Per-Stake Breakdown */}
                <div className="border-t border-white/10 pt-3">
                  <div className="text-xs text-gray-400 uppercase mb-2">Stake Rewards</div>
                  {withdrawal.breakdown.stakeRewards.map((stake: any, index: number) => (
                    <div key={stake.stakeId} className="flex justify-between py-1">
                      <span className="text-gray-400">Stake #{index + 1} ({formatCurrency(stake.amount)})</span>
                      <span className="text-accent font-bold">{formatCurrency(stake.reward)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 border-t border-white/10 mt-2">
                    <span className="font-semibold">Total Stake Rewards</span>
                    <span className="text-accent font-bold">{formatCurrency(withdrawal.breakdown.totalStakeRewards)}</span>
                  </div>
                </div>

                {/* Referral Commissions */}
                <div className="flex justify-between py-2 border-t border-white/10">
                  <span className="font-semibold">Referral Commissions</span>
                  <span className="text-gold font-bold">{formatCurrency(withdrawal.breakdown.referralCommissions)}</span>
                </div>
              </div>
            </div>

            {/* Withdrawal Wallet Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Withdrawal Wallet Address (BSC)
              </label>
              <input
                type="text"
                value={withdrawWallet}
                onChange={(e) => setWithdrawWallet(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-accent focus:bg-white/10 transition-all"
              />
              <div className="text-xs text-gray-500 mt-2">
                Enter your Binance Smart Chain wallet address to receive USDT
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                disabled={isProcessingWithdraw}
                className="flex-1 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-semibold hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawSubmit}
                disabled={isProcessingWithdraw || !withdrawWallet}
                className="flex-1 py-3 bg-accent text-black font-extrabold rounded-lg uppercase tracking-wide hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isProcessingWithdraw ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>

            {/* Important Notice */}
            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="text-xs text-yellow-400">
                <span className="font-bold">⚠️ Important:</span> Withdrawals are only processed on the 1st of each month.
                Please ensure your wallet address is correct as transactions cannot be reversed.
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
