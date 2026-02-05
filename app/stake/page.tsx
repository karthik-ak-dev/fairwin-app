'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useStakeDeposit } from '@/lib/hooks/useStakeDeposit';
import { QRCodeSVG } from 'qrcode.react';

export default function StakePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [copiedWallet, setCopiedWallet] = useState(false);

  const {
    amount,
    isProcessing,
    centralWallet,
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
    pendingStake,
    handleAmountChange,
    handlePresetClick,
    handleCreateStake,
    handleSubmitTxHash,
  } = useStakeDeposit();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-5">
            <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              MASSIVE<span className="text-accent">HIKE</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-6 lg:gap-9">
              <Link href="/" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Home
              </Link>
              <Link href="/dashboard" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Dashboard
              </Link>
              <Link href="/referrals" className="hidden sm:block text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Referrals
              </Link>
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
                className="block px-4 py-3 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg uppercase tracking-wider transition-colors"
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
            </div>
          </div>
        )}
      </nav>

      {/* Page Header */}
      <header className="pt-24 sm:pt-28 pb-6 sm:pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-4 sm:mb-5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>→</span>
            <span>Stake</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2 sm:mb-3">Stake USDT</h1>
          <p className="text-base sm:text-lg text-gray-400">Lock your USDT for 24 months and earn 8% monthly</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
          {/* Left: Stake Form */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8 lg:p-10">
            {/* Amount Section */}
            <div className="mb-6 sm:mb-8">
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3">
                💰 Stake Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 sm:px-6 py-4 sm:py-6 pr-20 sm:pr-32 bg-white/[0.02] border-2 border-white/8 rounded-xl text-white text-2xl sm:text-3xl lg:text-4xl font-bold focus:outline-none focus:border-accent focus:bg-white/[0.05] transition-all placeholder:text-gray-500"
                />
                <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-sm sm:text-base lg:text-lg font-bold text-gray-400">
                  USDT
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs text-gray-400 mt-2">
                <span>Minimum: ${MIN_STAKE}</span>
                <span>Maximum: ${MAX_STAKE.toLocaleString()} per stake</span>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3">
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

{/* Conditional Rendering: Step 1 (Create Stake) OR Step 2 (Submit Txn Hash) */}
            {!pendingStake ? (
              // STEP 1: Create Stake Entry
              <button
                onClick={handleCreateStake}
                disabled={!canStake}
                className={`w-full py-5 rounded-xl font-extrabold text-base uppercase tracking-wide transition-transform ${
                  canStake
                    ? 'bg-accent text-black hover:scale-[1.02]'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isProcessing
                  ? 'Creating Stake...'
                  : `Create Stake ${parseFloat(amount) || 0} USDT →`}
              </button>
            ) : (
              // STEP 2: Show QR Code + Submit Transaction Hash
              <>
                {/* Central Wallet Section */}
                <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-sm font-bold text-accent mb-1">✅ Stake Created! Now Send USDT</div>
                      <div className="text-xs text-gray-400">
                        Send exactly {formatCurrency(pendingStake.amount)} USDT to this address (BSC Network)
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-4 mb-4">
                    <div className="bg-white p-4 rounded-xl">
                      <QRCodeSVG value={centralWallet} size={160} />
                    </div>

                    {/* Wallet Address */}
                    <div className="w-full">
                      <div className="relative">
                        <div className="font-mono text-xs sm:text-sm text-accent p-3 bg-black/50 rounded-lg break-all pr-20">
                          {centralWallet}
                        </div>
                        <button
                          onClick={() => copyToClipboard(centralWallet)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-semibold rounded-md transition-all"
                        >
                          {copiedWallet ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex gap-2">
                    <div className="text-base flex-shrink-0">⚠️</div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      Send exactly <span className="text-white font-semibold">{formatCurrency(pendingStake.amount)}</span> on <span className="text-white font-semibold">Binance Smart Chain (BSC)</span> network only!
                    </div>
                  </div>
                </div>

                {/* Transaction Hash Section */}
                <div className="bg-white/3 border border-white/8 rounded-xl p-6 mb-6">
                  <div className="text-sm font-bold mb-1">Submit Transaction Hash</div>
                  <div className="text-xs text-gray-400 mb-4">
                    After sending USDT, paste your transaction hash here to verify your stake
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 bg-white/[0.02] border-2 border-white/8 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-accent focus:bg-white/[0.05] transition-all placeholder:text-gray-500"
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Find this in your wallet's transaction history or on BSCScan
                  </div>
                </div>

                {/* Verify Payment Button */}
                <button
                  onClick={() => handleSubmitTxHash(txHash)}
                  disabled={!txHash || txHash.length < 10 || isProcessing}
                  className={`w-full py-5 rounded-xl font-extrabold text-base uppercase tracking-wide transition-transform ${
                    txHash && txHash.length >= 10 && !isProcessing
                      ? 'bg-accent text-black hover:scale-[1.02]'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessing
                    ? 'Verifying Transaction...'
                    : 'Verify Payment & Complete Stake →'}
                </button>
              </>
            )}
          </div>

          {/* Right: Summary Card */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8 lg:sticky lg:top-28 h-fit">
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
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-accent leading-none mb-1">
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
