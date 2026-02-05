'use client';

import { useState } from 'react';
import { useReferralsPage } from '@/lib/hooks/useReferralsPage';
import { useAuth } from '@/lib/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { formatCurrency, copyToClipboard } from '@/lib/utils/format';

export default function ReferralsPage() {
  const { stats, rootUser, levelSummary, recentEarnings, commissionRates, referralLink, allReferrals } = useReferralsPage();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter referrals based on search query (by name)
  const filteredReferrals = allReferrals.filter((ref) =>
    ref.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-20">
      <Navigation />

      {/* Page Header */}
      <header className="pt-24 sm:pt-28 pb-6 sm:pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2">Referral Network</h1>
          <p className="text-sm sm:text-base text-gray-400">Build your downline and earn up to 15% commission on 5 levels</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 mb-8 sm:mb-10">
          {/* Total Earnings */}
          <div className="bg-white/3 border border-gold/30 rounded-2xl p-4 sm:p-6 hover:border-gold hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Total Earnings</span>
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-gold mb-1">{formatCurrency(stats.totalEarnings)}</div>
            <div className="text-xs sm:text-sm text-gray-400">TOTAL EARNINGS</div>
          </div>

          {/* Direct Referrals */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-gold hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Direct Referrals</span>
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1">{stats.directReferrals}</div>
            <div className="text-xs sm:text-sm text-gray-400">DIRECT REFERRALS</div>
          </div>

          {/* Total Network */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-gold hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Total Network</span>
              <span className="text-xl sm:text-2xl">🌳</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1">{stats.totalNetwork}</div>
            <div className="text-xs sm:text-sm text-gray-400">TOTAL NETWORK</div>
          </div>

          {/* Network TVL */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-gold hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Network TVL</span>
              <span className="text-xl sm:text-2xl">💎</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1">{formatCurrency(stats.networkTVL)}</div>
            <div className="text-xs sm:text-sm text-gray-400">NETWORK TVL</div>
          </div>

          {/* Avg Commission */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4 sm:p-6 hover:border-gold hover:-translate-y-0.5 transition-all">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Avg Commission</span>
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black mb-1">{stats.avgCommission}%</div>
            <div className="text-xs sm:text-sm text-gray-400">AVG COMMISSION</div>
          </div>
        </div>

        {/* Network Tree & Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Left Column - Network Tree */}
          <div>
            {/* Network Tree */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🌳</span>
                <h2 className="text-xl font-extrabold">Your Network Tree</h2>
              </div>

              {/* Root User */}
              <div className="bg-gradient-to-r from-gold/10 to-gold/5 border-2 border-gold/30 rounded-xl p-4 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                      👤
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm sm:text-base font-bold">{user?.name || 'You'}</span>
                        <span className="px-2 py-0.5 bg-gold/20 border border-gold text-gold text-xs font-bold rounded uppercase">
                          ROOT
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">{user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="text-left sm:text-right">
                      <div className="text-lg sm:text-xl font-black text-gold">{formatCurrency(rootUser.staked)}</div>
                      <div className="text-xs text-gray-400 uppercase">STAKED</div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-lg sm:text-xl font-black">{rootUser.network}</div>
                      <div className="text-xs text-gray-400 uppercase">NETWORK</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Level Summary - Layered Tree Structure */}
              <div className="space-y-2.5">
                {levelSummary.map((levelData, index) => {
                  const levelColorMap: { [key: number]: { bg: string; text: string; border: string; leftBorder: string } } = {
                    1: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', leftBorder: 'border-orange-500/30' },
                    2: { bg: 'bg-orange-400/10', text: 'text-orange-300', border: 'border-orange-400/30', leftBorder: 'border-orange-400/30' },
                    3: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', leftBorder: 'border-red-500/30' },
                    4: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', leftBorder: 'border-purple-500/30' },
                    5: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', leftBorder: 'border-blue-500/30' },
                  };
                  const colors = levelColorMap[levelData.level];
                  const paddingLeft = `${index * 32}px`; // 32px per level for nesting

                  return (
                    <div
                      key={levelData.level}
                      className={`border-l-2 ${colors.leftBorder}`}
                      style={{ paddingLeft }}
                    >
                      <div className={`${colors.bg} border ${colors.border} rounded-xl p-3 sm:p-4 hover:bg-white/[0.04] transition-all ml-4 sm:ml-8`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                          {/* Left: Level Badge & Info */}
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 ${colors.bg} border ${colors.border} rounded-full flex items-center justify-center text-sm sm:text-base font-bold ${colors.text} flex-shrink-0`}>
                              L{levelData.level}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold mb-0.5">Level {levelData.level}</div>
                              <div className="text-xs text-gray-400">{levelData.members} member{levelData.members !== 1 ? 's' : ''} • {levelData.commissionRate}% commission</div>
                            </div>
                          </div>

                          {/* Right: Stats Grid */}
                          <div className="flex items-center gap-3 sm:gap-6">
                            <div className="text-left sm:text-right">
                              <div className="text-xs text-gray-400 uppercase mb-0.5">Total Staked</div>
                              <div className="text-sm sm:text-base font-black">{formatCurrency(levelData.totalStaked)}</div>
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-xs text-gray-400 uppercase mb-0.5">Your Earnings</div>
                              <div className="text-sm sm:text-base font-black text-gold">{formatCurrency(levelData.yourEarnings)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Share Your Link */}
            <div className="bg-gradient-to-br from-gold/10 to-gold/2 border border-gold/30 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">🔗</span>
                <h3 className="text-lg font-extrabold">Share Your Link</h3>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your Referral Link</div>
                <div className="bg-black/30 border border-white/8 rounded-lg p-3 font-mono text-sm text-gold break-all">
                  {referralLink}
                </div>
              </div>

              <button
                onClick={() => copyToClipboard(referralLink)}
                className="w-full py-3.5 bg-gold text-black font-bold text-sm rounded-lg uppercase tracking-wide hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
              >
                📋 Copy Referral Link
              </button>
            </div>

            {/* Commission Rates */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-extrabold mb-4 sm:mb-5 text-center">Commission Rates</h3>

              <div className="space-y-2">
                {commissionRates.map((rate) => (
                  <div
                    key={rate.level}
                    className="flex justify-between items-center py-1.5"
                  >
                    <span className="text-xs sm:text-sm text-gray-400">{rate.label}</span>
                    <span className="text-lg sm:text-xl font-black text-gold">{rate.rate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Sections Below */}
        <div className="space-y-6 lg:space-y-8">
          {/* Recent Earnings */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">💸</span>
                <h2 className="text-xl font-extrabold">Recent Earnings</h2>
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                  {/* Header */}
                  <div className="grid grid-cols-4 gap-3 sm:gap-4 pb-3 border-b border-white/8 text-xs text-gray-400 uppercase tracking-wider min-w-[480px]">
                    <div>Referral</div>
                    <div className="text-center">Level</div>
                    <div className="text-right">Amount</div>
                    <div className="text-right">Date</div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-0 min-w-[480px]">
                    {recentEarnings.map((earning, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-4 gap-3 sm:gap-4 py-3 border-b border-white/8 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="text-xs sm:text-sm text-gray-300">{earning.referralName}</div>
                        <div className="text-center">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-bold rounded uppercase ${
                              earning.level === 1
                                ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                                : earning.level === 2
                                ? 'bg-orange-500/10 border border-orange-500/30 text-orange-300'
                                : earning.level === 3
                                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                : earning.level === 4
                                ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                                : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                            }`}
                          >
                            L{earning.level}
                          </span>
                        </div>
                        <div className="text-right text-gold font-bold text-sm sm:text-base">{formatCurrency(earning.amount)}</div>
                        <div className="text-right text-xs sm:text-sm text-gray-400">{earning.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* All Referrals */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  <h2 className="text-lg sm:text-xl font-extrabold">All Referrals</h2>
                  <span className="text-xs sm:text-sm text-gray-400">({allReferrals.length} total)</span>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-auto">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full sm:w-64 px-4 py-2 bg-white/[0.02] border border-white/8 rounded-lg text-white text-sm focus:outline-none focus:border-gold focus:bg-white/[0.05] transition-all placeholder:text-gray-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle px-6 sm:px-0">
                  {/* Header */}
                  <div className="grid grid-cols-5 gap-4 pb-3 border-b border-white/8 text-xs text-gray-400 uppercase tracking-wider min-w-[700px]">
                    <div>Name</div>
                    <div className="text-center">Level</div>
                    <div className="text-right">Joined Date</div>
                    <div className="text-right">Staked</div>
                    <div className="text-right">Your Earnings</div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-0 min-w-[700px]">
                    {filteredReferrals.length > 0 ? (
                      filteredReferrals.map((referral, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-5 gap-4 py-3 border-b border-white/8 last:border-b-0 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="text-sm text-gray-300">{referral.name}</div>
                          <div className="text-center">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs font-bold rounded uppercase ${
                                referral.level === 1
                                  ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400'
                                  : referral.level === 2
                                  ? 'bg-orange-500/10 border border-orange-500/30 text-orange-300'
                                  : referral.level === 3
                                  ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                  : referral.level === 4
                                  ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                              }`}
                            >
                              L{referral.level}
                            </span>
                          </div>
                          <div className="text-right text-sm text-gray-400">{referral.joinedDate}</div>
                          <div className="text-right font-bold">{formatCurrency(referral.staked)}</div>
                          <div className="text-right text-gold font-bold">{formatCurrency(referral.yourEarnings)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-400">
                        No referrals found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
