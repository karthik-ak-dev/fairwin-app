'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useDashboard } from '@/lib/hooks/useDashboard';

export default function DashboardPage() {
  const { walletAddress, stats, stakes, referrals, withdrawal, referralLink } = useDashboard();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-5">
            <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              MASSIVE<span className="text-accent">HIKE</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-6 lg:gap-9">
              <Link href="/" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Home
              </Link>
              <Link href="/dashboard" className="hidden sm:block text-sm font-medium text-white uppercase tracking-wider transition-colors">
                Dashboard
              </Link>
              <Link href="/referrals" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Referrals
              </Link>
              <div className="hidden sm:flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="font-mono text-xs sm:text-sm font-semibold text-accent">
                  {formatWalletAddress(walletAddress)}
                </span>
              </div>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-2 text-white hover:text-accent transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-white/8 bg-bg/98 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg uppercase tracking-wider transition-colors"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-white bg-accent/10 rounded-lg uppercase tracking-wider transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/referrals"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg uppercase tracking-wider transition-colors"
              >
                Referrals
              </Link>
              <div className="flex items-center gap-2 px-4 py-3 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span className="font-mono text-xs font-semibold text-accent">
                  {formatWalletAddress(walletAddress)}
                </span>
              </div>
            </div>
          </div>
        )}
      </nav>

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
                <span className="text-sm text-gray-400">{stakes.length} Active</span>
              </div>

              <div className="space-y-5">
                {stakes.map((stake) => {
                  const progress = (stake.monthsElapsed / stake.totalMonths) * 100;
                  return (
                    <div
                      key={stake.id}
                      className="bg-white/[0.02] border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-accent hover:bg-white/[0.04] transition-all"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4 sm:mb-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-sm sm:text-base font-bold text-gray-400">Stake #{stake.id}</span>
                          <span className="text-2xl sm:text-3xl font-black text-accent">{formatCurrency(stake.amount)}</span>
                        </div>
                        <span className="px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-md text-xs font-bold text-accent uppercase tracking-wide">
                          {stake.status}
                        </span>
                      </div>

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

                      {/* Progress Bar */}
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

                      {/* Footer */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-white/8">
                        <span className="text-xs text-gray-400">Started {stake.startDate}</span>
                        <span className="text-xs sm:text-sm font-bold text-accent">Next reward: {stake.nextRewardDate}</span>
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
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
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
      <footer className="border-t border-white/8 py-6 sm:py-9 mt-12 sm:mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-8">
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
