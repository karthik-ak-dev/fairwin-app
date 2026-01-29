import Link from 'next/link';

const FOOTER_LINKS: readonly { label: string; href: string; external?: boolean }[] = [
  { label: 'Contract', href: 'https://polygonscan.com/address/0x0000000000000000000000000000000000000000', external: true },
  { label: 'GitHub', href: 'https://github.com/fairwin', external: true },
  { label: 'Docs', href: 'https://docs.fairwin.io', external: true },
  { label: 'Twitter', href: 'https://twitter.com/fairwin', external: true },
  { label: 'Discord', href: 'https://discord.gg/fairwin', external: true },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] py-8">
      <div className="max-w-[1200px] mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Links */}
        <nav className="flex flex-wrap items-center gap-6">
          {FOOTER_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#888888] uppercase tracking-[0.1em] transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-[#888888] uppercase tracking-[0.1em] transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Copyright */}
        <p className="text-xs text-[#888888] whitespace-nowrap">
          © 2026 FairWin. 100% On-Chain. 100% Verifiable.
        </p>
      </div>
    </footer>
  );
}
