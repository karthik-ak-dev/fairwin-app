'use client';

import Link from 'next/link';
import { useLanding } from '@/lib/hooks/useLanding';

export default function LandingPage() {
  const { stats, referralRates } = useLanding();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/95 backdrop-blur-xl border-b border-white/8">
        <div className="container mx-auto px-8">
          <div className="flex justify-between items-center py-5">
            <Link href="/" className="text-2xl font-extrabold tracking-tight text-white">
              MASSIVE<span className="text-accent">HIKE</span>
            </Link>
            <div className="flex items-center gap-9">
              <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Home
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                How it Works
              </Link>
              <Link href="#referrals" className="text-sm font-medium text-gray-400 hover:text-white uppercase tracking-wider transition-colors">
                Referrals
              </Link>
              <button className="px-6 py-3 bg-accent text-black font-bold text-sm rounded-md uppercase tracking-wide hover:scale-105 transition-transform">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-20 text-center">
        <div className="container mx-auto px-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-accent/10 border border-accent/30 rounded-full text-xs font-bold text-accent uppercase tracking-wider mb-6">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            Live on BSC Mainnet
          </div>
          <h1 className="text-7xl font-black tracking-tighter leading-tight mb-5 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            Stake Once.<br />
            Earn <span className="text-accent">8% Monthly</span><br />
            For 24 Months.
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Simple staking with guaranteed returns. Plus earn up to 15% commission from 5-level referrals. No complex DeFi, no impermanent loss, just consistent rewards.
          </p>
          <div className="flex gap-4 justify-center items-center">
            <Link href="/stake" className="px-10 py-5 bg-accent text-black font-bold text-base rounded-xl uppercase tracking-wide hover:scale-105 transition-transform">
              Start Staking →
            </Link>
            <Link href="/dashboard" className="px-10 py-5 bg-transparent text-white font-bold text-base border-2 border-white/8 rounded-xl uppercase tracking-wide hover:border-white hover:bg-white/5 transition-all">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="container mx-auto px-8">
        <div className="bg-white/3 border border-white/8 rounded-2xl p-8 max-w-4xl mx-auto mb-16">
          <div className="grid grid-cols-3 gap-10">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-accent mb-2">
                {formatCurrency(stats.totalStaked)}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                Total Value Locked
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-accent mb-2">
                {formatNumber(stats.activeStakers)}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                Active Stakers
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-extrabold text-accent mb-2">
                {formatCurrency(stats.totalRewardsDistributed)}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                Rewards Paid
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/8 rounded-full text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
              💎 Simple Process
            </div>
            <h2 className="text-5xl font-black tracking-tight mb-4">How It Works</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Start earning in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center hover:border-accent hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 bg-accent/10 border-2 border-accent rounded-full flex items-center justify-center text-2xl font-extrabold text-accent mx-auto mb-5">
                1
              </div>
              <div className="text-5xl mb-5">💰</div>
              <h3 className="text-xl font-bold mb-3">Stake USDT</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Deposit between $50 to $10,000 USDT on Binance Smart Chain. Lock for 24 months.
              </p>
            </div>

            <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center hover:border-accent hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 bg-accent/10 border-2 border-accent rounded-full flex items-center justify-center text-2xl font-extrabold text-accent mx-auto mb-5">
                2
              </div>
              <div className="text-5xl mb-5">📈</div>
              <h3 className="text-xl font-bold mb-3">Earn Daily</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Watch your rewards accumulate daily at 8% monthly rate. Withdraw every month.
              </p>
            </div>

            <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center hover:border-accent hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 bg-accent/10 border-2 border-accent rounded-full flex items-center justify-center text-2xl font-extrabold text-accent mx-auto mb-5">
                3
              </div>
              <div className="text-5xl mb-5">💸</div>
              <h3 className="text-xl font-bold mb-3">Withdraw Monthly</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Claim your accumulated rewards on the 1st of every month. Principal returned after 24 months.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Reward System */}
      <section id="referrals" className="py-20">
        <div className="container mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/8 rounded-full text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">
              💵 Earning Potential
            </div>
            <h2 className="text-5xl font-black tracking-tight mb-4">Dual Reward System</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Earn from staking + referrals
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Staking Rewards */}
            <div className="bg-gradient-to-br from-accent/10 to-accent/2 border border-accent/30 rounded-2xl p-10">
              <div className="text-6xl mb-5">💎</div>
              <h3 className="text-3xl font-extrabold mb-3">Staking Rewards</h3>
              <div className="text-7xl font-black text-accent leading-none mb-2">8%</div>
              <p className="text-base text-gray-400 mb-6">Monthly on your stake</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-accent text-xl">✓</span>
                  <span>Guaranteed 8% monthly returns</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-accent text-xl">✓</span>
                  <span>Daily reward accumulation</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-accent text-xl">✓</span>
                  <span>Withdraw every month</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-accent text-xl">✓</span>
                  <span>24-month program</span>
                </div>
              </div>
            </div>

            {/* Referral Rewards */}
            <div className="bg-gradient-to-br from-gold/10 to-gold/2 border border-gold/30 rounded-2xl p-10">
              <div className="text-6xl mb-5">🤝</div>
              <h3 className="text-3xl font-extrabold mb-3">Referral Rewards</h3>
              <div className="text-7xl font-black text-gold leading-none mb-2">15%</div>
              <p className="text-base text-gray-400 mb-6">Up to 15% commission</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gold text-xl">✓</span>
                  <span>5-level referral system</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gold text-xl">✓</span>
                  <span>Instant commission on stakes</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gold text-xl">✓</span>
                  <span>Build passive income</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gold text-xl">✓</span>
                  <span>Track your downline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Levels */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-10 mt-8">
            <h3 className="text-2xl font-extrabold mb-6 text-center">🏆 Referral Commission Breakdown</h3>
            <div className="grid grid-cols-5 gap-4">
              {referralRates.map((level) => (
                <div key={level.level} className="text-center p-5 bg-white/2 border border-white/8 rounded-xl">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Level {level.level}
                  </div>
                  <div className="text-3xl font-extrabold text-gold">
                    {level.rate}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-8">
          <div className="bg-gradient-to-br from-accent/15 to-accent/2 border border-accent/30 rounded-3xl p-16 text-center">
            <h2 className="text-5xl font-black mb-4">Ready to Start Earning?</h2>
            <p className="text-lg text-gray-400 mb-8">
              Connect your wallet and make your first stake in under 2 minutes
            </p>
            <Link href="/stake" className="inline-block px-10 py-5 bg-accent text-black font-bold text-base rounded-xl uppercase tracking-wide hover:scale-105 transition-transform">
              Connect Wallet & Stake →
            </Link>
          </div>
        </div>
      </section>

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
