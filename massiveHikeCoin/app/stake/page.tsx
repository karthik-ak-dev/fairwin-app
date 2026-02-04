'use client';

import Link from 'next/link';
import { useStakeDeposit } from '@/lib/hooks/useStakeDeposit';

export default function StakePage() {
  const {
    amount,
    isProcessing,
    walletAddress,
    depositWallet,
    existingStakes,
    totalStaked,
    totalActiveStakes,
    calculations,
    MONTHLY_RATE,
    STAKE_DURATION_MONTHS,
    MIN_STAKE,
    MAX_STAKE,
    presetAmounts,
    isValidAmount,
    canStake,
    handleAmountChange,
    handlePresetClick,
    handleStake,
  } = useStakeDeposit();

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
              <Link href="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
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
        <div className="container mx-auto px-8">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>→</span>
            <span>Stake</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3">Stake USDT</h1>
          <p className="text-lg text-gray-400">Lock your USDT for 24 months and earn 8% monthly</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Left: Stake Form */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-10">
            {/* Amount Section */}
            <div className="mb-8">
              <label className="block text-sm font-bold uppercase tracking-wider mb-3">
                💰 Stake Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-6 py-6 pr-32 bg-white/[0.02] border-2 border-white/8 rounded-xl text-white text-4xl font-bold focus:outline-none focus:border-accent focus:bg-white/[0.05] transition-all placeholder:text-gray-500"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400">
                  USDT
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Minimum: ${MIN_STAKE}</span>
                <span>Maximum: ${MAX_STAKE.toLocaleString()} per stake</span>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-4 gap-3 mt-3">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetClick(preset)}
                    className={`py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                      amount === preset.toString()
                        ? 'bg-accent/10 border border-accent text-accent'
                        : 'bg-white/2 border border-white/8 text-gray-400 hover:bg-white/5 hover:border-white hover:text-white'
                    }`}
                  >
                    ${preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Stake Details */}
            <div className="mb-8">
              <label className="block text-sm font-bold uppercase tracking-wider mb-3">
                📊 Stake Details
              </label>
              <div className="space-y-0">
                <div className="flex justify-between items-center py-4 border-b border-white/8">
                  <span className="text-sm text-gray-400">Lock Period</span>
                  <span className="text-base font-bold">{STAKE_DURATION_MONTHS} Months</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-white/8">
                  <span className="text-sm text-gray-400">Monthly Rate</span>
                  <span className="text-xl font-bold text-accent">{(MONTHLY_RATE * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-white/8">
                  <span className="text-sm text-gray-400">Daily Accumulation</span>
                  <span className="text-base font-bold">{formatCurrency(calculations.dailyEarnings)} / day</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-white/8">
                  <span className="text-sm text-gray-400">Monthly Withdrawal</span>
                  <span className="text-xl font-bold text-accent">{formatCurrency(calculations.monthlyEarnings)}</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-sm text-gray-400">Total Over 24 Months</span>
                  <span className="text-xl font-bold text-accent">{formatCurrency(calculations.totalEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex gap-3 mb-6">
              <div className="text-xl flex-shrink-0">💡</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-accent mb-1">No Stake Limit</div>
                <div className="text-sm text-gray-400 leading-relaxed">
                  You can create unlimited stakes! Each stake is independent with its own 24-month timeline. Min ${MIN_STAKE}, max ${MAX_STAKE.toLocaleString()} per stake.
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3 mb-6">
              <div className="text-xl flex-shrink-0">⚠️</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-yellow-500 mb-1">24-Month Lock Period</div>
                <div className="text-sm text-gray-400 leading-relaxed">
                  Your principal ({formatCurrency(calculations.principal)} USDT) will be locked for 24 months. You can withdraw accumulated rewards monthly, but principal is only available after the lock period ends.
                </div>
              </div>
            </div>

            {/* Deposit Wallet Section */}
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 mb-8">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                🏦 Your Deposit Wallet (Where You Stake From)
              </div>
              <div className="font-mono text-sm text-accent p-3 bg-black/50 rounded-lg mb-2 break-all">
                {depositWallet}
              </div>
              <div className="text-xs text-gray-400 leading-relaxed">
                ⚠️ Rewards will be sent to a different wallet address when you withdraw monthly.
              </div>
            </div>

            {/* Stake Button */}
            <button
              onClick={handleStake}
              disabled={!canStake}
              className={`w-full py-5 rounded-xl font-extrabold text-base uppercase tracking-wide transition-transform ${
                canStake
                  ? 'bg-accent text-black hover:scale-[1.02]'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing
                ? 'Processing...'
                : `Approve & Stake ${parseFloat(amount) || 0} USDT →`}
            </button>
          </div>

          {/* Right: Summary Card */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-8 lg:sticky lg:top-28 h-fit">
            <h3 className="text-xl font-extrabold mb-6 flex items-center gap-2">
              📈 Earnings Summary
            </h3>

            {/* Current Stake Summary */}
            <div className="pb-6 mb-6 border-b border-white/8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-400">Your Stake</span>
                <span className="text-base font-bold">{formatCurrency(calculations.principal)} USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Duration</span>
                <span className="text-base font-bold">{STAKE_DURATION_MONTHS} Months</span>
              </div>
            </div>

            {/* Earnings Projection */}
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-5 text-center mb-6">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                Total Earnings Projection
              </div>
              <div className="text-5xl font-black text-accent leading-none mb-1">
                {formatCurrency(calculations.totalEarnings)}
              </div>
              <div className="text-sm text-gray-400">over 24 months</div>
            </div>

            {/* Existing Stakes */}
            {existingStakes.length > 0 && (
              <div className="bg-white/2 border border-white/8 rounded-xl p-5">
                <div className="text-sm font-bold mb-4">Your Existing Stakes</div>
                {existingStakes.map((stake) => (
                  <div key={stake.id} className="flex justify-between items-center py-2 text-sm border-b border-white/8 last:border-b-0 last:pb-0">
                    <span className="text-gray-400">Stake #{stake.id}</span>
                    <span className="font-bold">{formatCurrency(stake.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/8 font-bold">
                  <span>Total Staked</span>
                  <span className="text-accent">{formatCurrency(totalStaked)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-gray-400">Active Stakes</span>
                  <span className="font-bold">{totalActiveStakes}</span>
                </div>
              </div>
            )}
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
