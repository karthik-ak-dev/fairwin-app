'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { formatCurrency } from '@/lib/utils/format';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();
  const { stats, stakes } = useDashboard();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-6 py-3 bg-accent text-black font-bold rounded-lg"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Navigation />

      {/* Page Header */}
      <header className="pt-24 sm:pt-28 pb-6 sm:pb-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2">
            Profile
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Manage your account settings and view your activity
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Account Information
              </h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-sm text-gray-400 uppercase tracking-wider">
                    Name
                  </label>
                  <div className="mt-1 text-lg font-bold">{user.name}</div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm text-gray-400 uppercase tracking-wider">
                    Email
                  </label>
                  <div className="mt-1 text-lg font-bold">{user.email}</div>
                </div>

                {/* Account Created */}
                <div>
                  <label className="text-sm text-gray-400 uppercase tracking-wider">
                    Member Since
                  </label>
                  <div className="mt-1 text-lg font-bold">
                    {new Date(stats.activeStakesCount > 0 ? '2025-01-01' : Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Addresses */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                <span className="text-2xl">💼</span>
                Wallet Information
              </h2>

              <div className="space-y-4">
                {/* Deposit Wallet */}
                <div>
                  <label className="text-sm text-gray-400 uppercase tracking-wider">
                    Deposit Wallet (for staking)
                  </label>
                  <div className="mt-1 text-sm font-mono bg-white/5 px-4 py-3 rounded-lg border border-white/10 break-all">
                    {process.env.NEXT_PUBLIC_DEPOSIT_WALLET_ADDRESS || 'Not configured'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Send your USDT to this address when creating a stake
                  </p>
                </div>

                {/* Contract Address */}
                <div>
                  <label className="text-sm text-gray-400 uppercase tracking-wider">
                    USDT Contract Address (BSC)
                  </label>
                  <div className="mt-1 text-sm font-mono bg-white/5 px-4 py-3 rounded-lg border border-white/10 break-all">
                    {process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Quick Stats
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">
                    Total Staked
                  </div>
                  <div className="text-2xl font-black text-gold mt-1">
                    {formatCurrency(stats.totalStaked)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">
                    Active Stakes
                  </div>
                  <div className="text-2xl font-black mt-1">
                    {stats.activeStakesCount}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">
                    Total Referrals
                  </div>
                  <div className="text-2xl font-black mt-1">
                    {stats.totalReferrals}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">
                    Earned to Date
                  </div>
                  <div className="text-2xl font-black text-gold mt-1">
                    {formatCurrency(stats.earnedToDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                <span className="text-xl">⚙️</span>
                Actions
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-left font-bold hover:bg-white/10 hover:border-accent transition"
                >
                  📈 View Dashboard
                </button>

                <button
                  onClick={() => router.push('/stake')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-left font-bold hover:bg-white/10 hover:border-accent transition"
                >
                  💰 Create New Stake
                </button>

                <button
                  onClick={() => router.push('/referrals')}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-left font-bold hover:bg-white/10 hover:border-accent transition"
                >
                  👥 View Referrals
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-left font-bold hover:bg-red-500/20 hover:border-red-500 transition"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <h4 className="font-bold text-yellow-400 text-sm mb-1">
                    Security Notice
                  </h4>
                  <p className="text-xs text-yellow-300/80">
                    Never share your private keys or seed phrases. Always verify
                    wallet addresses before sending funds.
                  </p>
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
