'use client';

import { ConnectButton as RainbowKitConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectButton() {
  return (
    <RainbowKitConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none' as const,
                userSelect: 'none' as const,
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="rounded-lg bg-[#00ff88] px-6 py-3 text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-[#00e07a]"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="rounded-lg bg-red-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
                  >
                    Switch Network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2 transition-colors hover:border-[#00ff88]/30 hover:bg-zinc-800"
                >
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-mono text-xs text-white">
                    {account.displayName}
                  </span>
                </button>
              );
            })()}
          </div>
        );
      }}
    </RainbowKitConnectButton.Custom>
  );
}
