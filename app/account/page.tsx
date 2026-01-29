'use client';

import { useAccount, useDisconnect } from 'wagmi';
import Header from '@/shared/components/layout/Header';
import Footer from '@/shared/components/layout/Footer';
import AccountHeader from '@/features/account/components/AccountHeader';
import AccountStats from '@/features/account/components/AccountStats';
import ActiveEntries from '@/features/account/components/ActiveEntries';
import EntryHistoryList from '@/features/account/components/EntryHistoryList';
import WinsList from '@/features/account/components/WinsList';
import ConnectButton from '@/shared/components/web3/ConnectButton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui';
import { useUserStats } from '@/features/account/hooks/useUserStats';

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { stats, isLoading: statsLoading } = useUserStats(address);

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-[1200px] mx-auto px-8 pt-24 pb-16">
        {!isConnected ? (
          /* ── Connect Prompt ── */
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] max-w-md w-full">
              <span className="text-[48px] block mb-4">🔗</span>
              <h2 className="text-xl font-bold text-white mb-2">
                Connect Your Wallet
              </h2>
              <p className="text-sm text-[#888888] mb-6">
                Connect your wallet to view your entries, wins, and account
                statistics.
              </p>
              <ConnectButton />
            </div>
          </div>
        ) : (
          /* ── Connected Account View ── */
          <div className="space-y-6">
            <AccountHeader
              address={address!}
              onDisconnect={() => disconnect()}
            />

            <AccountStats
              stats={stats}
              isLoading={statsLoading}
            />

            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">🎟️ Active Entries</TabsTrigger>
                <TabsTrigger value="history">📜 History</TabsTrigger>
                <TabsTrigger value="wins">🏆 Wins</TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <ActiveEntries address={address} />
              </TabsContent>

              <TabsContent value="history">
                <EntryHistoryList address={address} />
              </TabsContent>

              <TabsContent value="wins">
                <WinsList address={address} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
