'use client';

import ConnectButton from '@/shared/components/web3/ConnectButton';

export default function ConnectPrompt() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#333] bg-[#0a0a0a] p-8 flex flex-col items-center justify-center text-center">
      {/* Wallet icon */}
      <span className="text-[56px] mb-4">👛</span>

      {/* Heading */}
      <h3 className="text-2xl font-bold text-white mb-2">
        Connect Your Wallet
      </h3>

      {/* Subtext */}
      <p className="text-sm text-[#888888] mb-6 max-w-[280px]">
        Connect your wallet to enter this raffle and compete for prizes
      </p>

      {/* Connect button — uses RainbowKit */}
      <ConnectButton />
    </div>
  );
}
