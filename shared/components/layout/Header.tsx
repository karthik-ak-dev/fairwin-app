'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Raffle', href: '/games/raffle' },
  { label: 'Winners', href: '/winners' },
  { label: 'How It Works', href: '/how-it-works' },
] as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-black/60 backdrop-blur-xl">
        <div className="max-w-[1200px] mx-auto px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-0 select-none">
            <span className="text-xl font-bold tracking-tight text-white">
              FAIR
            </span>
            <span className="text-xl font-bold tracking-tight text-[#00ff88]">
              WIN
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-medium uppercase tracking-[0.15em] text-[#888888] transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side — Connect Wallet + Mobile Hamburger */}
          <div className="flex items-center gap-4">
            {/* RainbowKit Connect Button with custom rendering */}
            <div className="hidden md:block">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
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
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {connected ? (
                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white transition-colors hover:border-[#00ff88]/30 hover:bg-white/[0.06]"
                        >
                          <span className="h-2 w-2 rounded-full bg-[#00ff88]" />
                          <span className="font-mono text-xs">
                            {account.displayName}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="rounded-lg bg-[#00ff88] px-5 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                        >
                          Connect Wallet
                        </button>
                      )}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden flex-col items-center justify-center gap-[5px] w-8 h-8"
              aria-label="Toggle menu"
            >
              <span
                className={`block h-[2px] w-5 bg-white transition-transform duration-200 ${
                  mobileOpen ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`block h-[2px] w-5 bg-white transition-opacity duration-200 ${
                  mobileOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-[2px] w-5 bg-white transition-transform duration-200 ${
                  mobileOpen ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-out nav */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-300 ${
          mobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/80"
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <nav
          className={`absolute top-0 right-0 h-full w-72 bg-[#0a0a0a] border-l border-white/[0.08] pt-20 px-6 transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium uppercase tracking-[0.15em] text-[#888888] py-3 border-b border-white/[0.08] transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Connect */}
          <div className="mt-8">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
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
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {connected ? (
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-sm text-white w-full justify-center"
                      >
                        <span className="h-2 w-2 rounded-full bg-[#00ff88]" />
                        <span className="font-mono text-xs">
                          {account.displayName}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="w-full rounded-lg bg-[#00ff88] px-5 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </nav>
      </div>
    </>
  );
}
