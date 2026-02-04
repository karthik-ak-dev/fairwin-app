'use client';

import Link from 'next/link';
import { useDashboard } from '@/lib/hooks/useDashboard';

export default function DashboardPage() {
  const { walletAddress, stats, stakes, referrals, withdrawal, referralLink } = useDashboard();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-xl border-b border-white/8">
        <div className="container mx-auto px-8">
          <div className="flex justify-between items-center py-5">
            <Link href="/" className="text-2xl font-extrabold tracking-tight text-white">
              MASSIVE<span className="text-accent">HIKE</span>
            </Link>
            <div className="flex items-center gap-9">
              <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Home
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-white uppercase tracking-wider transition-colors">
                Dashboard
              </Link>
              <Link href="/referrals" className="text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Referrals
              </Link>
              <div className="flex items-center gap-3 px-5 py-2.5 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="font-mono text-sm font-semibold text-accent">
                  {formatWalletAddress(walletAddress)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Header */}
      <header className="pt-28 pb-10">
        <div className="container mx-auto px-8 max-w-7xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-black tracking-tight mb-2">Your Dashboard</h1>
              <p className="text-base text-gray-400">Track your stakes, rewards, and referrals</p>
            </div>
            <Link
              href="/stake"
              className="px-7 py-3.5 bg-accent text-black font-bold text-sm rounded-lg uppercase tracking-wide hover:scale-105 transition-transform"
            >
              + Stake More
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8 max-w-7xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-5 mb-10">
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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column */}
          <div>
            {/* Your Stakes Section */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-extrabold flex items-center gap-2">
                  💎 Your Stakes
                </h2>
                <span className="text-sm text-gray-400">{stakes.length} Active</span>
              </div>

              <div className="space-y-5">
                {stakes.map((stake) => {
                  const progress = (stake.monthsElapsed / stake.totalMonths) * 100;
                  return (
                    <div
                      key={stake.id}
                      className="bg-white/[0.02] border border-white/8 rounded-2xl p-6 hover:border-accent hover:bg-white/[0.04] transition-all"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-gray-400">Stake #{stake.id}</span>
                          <span className="text-3xl font-black text-accent">{formatCurrency(stake.amount)}</span>
                        </div>
                        <span className="px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-md text-xs font-bold text-accent uppercase tracking-wide">
                          {stake.status}
                        </span>
                      </div>

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Daily</div>
                          <div className="text-base font-bold">{formatCurrency(stake.dailyEarning)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Monthly</div>
                          <div className="text-base font-bold text-accent">{formatCurrency(stake.monthlyEarning)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Earned</div>
                          <div className="text-base font-bold text-accent">{formatCurrency(stake.totalEarned)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Progress</div>
                          <div className="text-base font-bold">{stake.monthsElapsed}/{stake.totalMonths}m</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
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

                      {/* Footer */}
                      <div className="flex justify-between items-center pt-4 border-t border-white/8">
                        <span className="text-xs text-gray-400">Started {stake.startDate}</span>
                        <span className="text-sm font-bold text-accent">Next reward: {stake.nextRewardDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Referral Overview */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8">
              <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                🤝 Referral Network
              </h2>

              {/* Total Earnings */}
              <div className="bg-gradient-to-br from-gold/10 to-gold/2 border border-gold/30 rounded-xl p-6 mb-6 text-center">
                <div className="text-5xl font-black text-gold mb-2">{formatCurrency(referrals.totalEarnings)}</div>
                <div className="text-sm text-gray-400">Total Referral Earnings</div>
              </div>

              {/* Levels Grid */}
              <div className="grid grid-cols-5 gap-3">
                {referrals.levels.map((level) => (
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
            <div className="bg-gradient-to-br from-accent/10 to-accent/2 border border-accent/30 rounded-2xl p-8 mb-6">
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
              <div className="mt-5 p-5 bg-white/[0.02] border border-white/8 rounded-xl">
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-400">Stake Rewards</span>
                  <span className="font-bold text-accent">{formatCurrency(withdrawal.breakdown.stakeRewards)}</span>
                </div>
                <div className="flex justify-between items-center py-2 text-sm">
                  <span className="text-gray-400">Referral Commissions</span>
                  <span className="font-bold text-accent">{formatCurrency(withdrawal.breakdown.referralCommissions)}</span>
                </div>
              </div>
            </div>

            {/* Referral Link Card */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8">
              <h3 className="text-lg font-extrabold mb-6 text-center">🔗 Your Referral Link</h3>

              <div className="bg-white/[0.02] border border-white/8 rounded-xl p-4 mb-4">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2 text-center">Share this link</div>
                <div className="font-mono text-xs text-accent break-all text-center">{referralLink}</div>
              </div>

              <button
                onClick={() => copyToClipboard(referralLink)}
                className="w-full py-3.5 bg-transparent border border-white/8 rounded-lg text-white text-sm font-semibold hover:bg-white/5 hover:border-white transition-all"
              >
                📋 Copy Link
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/8 py-9 mt-20">
        <div className="container mx-auto px-8">
          <div className="flex justify-between items-center">
            <div className="flex gap-8">
              <Link href="#" className="text-xs text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Contract
              </Link>
              <Link href="#" className="text-xs text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Docs
              </Link>
              <Link href="#" className="text-xs text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Support
              </Link>
              <Link href="#" className="text-xs text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Twitter
              </Link>
            </div>
            <div className="text-xs text-gray-400">
              © 2026 MassiveHikeCoin
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
