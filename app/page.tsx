'use client';

import Link from 'next/link';
import { useLanding } from '@/lib/hooks/useLanding';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

export default function LandingPage() {
  const { stats, referralRates } = useLanding();

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 lg:pb-20 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 bg-accent/10 border border-accent/30 rounded-full text-xs font-bold text-accent uppercase tracking-wider mb-4 sm:mb-6">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
            Live on BSC Mainnet
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight mb-4 sm:mb-5 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
            Stake Once.<br />
            Earn <span className="text-accent">8% Monthly</span><br />
            For 24 Months.
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8 lg:mb-10 leading-relaxed px-4">
            Simple staking with guaranteed returns. Plus earn up to 15% commission from 5-level referrals. No complex DeFi, no impermanent loss, just consistent rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4">
            <Link href="/auth/signin" className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-accent text-black font-bold text-sm sm:text-base rounded-xl uppercase tracking-wide hover:scale-105 transition-transform text-center">
              Get Started →
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-transparent text-white font-bold text-sm sm:text-base border-2 border-white/8 rounded-xl uppercase tracking-wide hover:border-white hover:bg-white/5 transition-all text-center">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-accent mb-2">
                {formatCurrency(stats.totalStaked)}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                Total Value Locked
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-accent mb-2">
                {formatNumber(stats.activeStakers)}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">
                Active Stakers
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-accent mb-2">
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
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 bg-white/5 border border-white/8 rounded-full text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 sm:mb-5">
              💎 Simple Process
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3 sm:mb-4">How It Works</h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto px-4">
              Start earning in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
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
      <section id="referrals" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 bg-white/5 border border-white/8 rounded-full text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 sm:mb-5">
              💵 Earning Potential
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-3 sm:mb-4">Dual Reward System</h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto px-4">
              Earn from staking + referrals
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Staking Rewards */}
            <Link href="/stake" className="bg-gradient-to-br from-accent/10 to-accent/2 border border-accent/30 rounded-2xl p-6 sm:p-8 lg:p-10 hover:scale-[1.02] hover:border-accent transition-all cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">💎</div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 sm:mb-3">Staking Rewards</h3>
              <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-accent leading-none mb-2">8%</div>
              <p className="text-sm sm:text-base text-gray-400 mb-5 sm:mb-6">Monthly on your stake</p>
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
            </Link>

            {/* Referral Rewards */}
            <Link href="/referrals" className="bg-gradient-to-br from-gold/10 to-gold/2 border border-gold/30 rounded-2xl p-6 sm:p-8 lg:p-10 hover:scale-[1.02] hover:border-gold transition-all cursor-pointer">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">🤝</div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-2 sm:mb-3">Referral Rewards</h3>
              <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-gold leading-none mb-2">15%</div>
              <p className="text-sm sm:text-base text-gray-400 mb-5 sm:mb-6">Up to 15% commission</p>
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
            </Link>
          </div>

          {/* Referral Levels */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8 lg:p-10 mt-6 sm:mt-8">
            <h3 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-6 text-center">🏆 Referral Commission Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {referralRates.map((level: any) => (
                <div key={level.level} className="text-center p-4 sm:p-5 bg-white/2 border border-white/8 rounded-xl">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Level {level.level}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gold">
                    {level.rate}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-accent/15 to-accent/2 border border-accent/30 rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3 sm:mb-4">Ready to Start Earning?</h2>
            <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8 px-4">
              Sign in with Google and make your first stake in under 2 minutes
            </p>
            <Link href="/auth/signin" className="inline-block px-8 sm:px-10 py-4 sm:py-5 bg-accent text-black font-bold text-sm sm:text-base rounded-xl uppercase tracking-wide hover:scale-105 transition-transform">
              Get Started Now →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
