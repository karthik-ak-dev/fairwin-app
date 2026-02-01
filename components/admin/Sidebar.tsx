'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: '📊' },
    ],
  },
  {
    title: 'Raffles',
    items: [
      { label: 'All Raffles', href: '/admin/raffles', icon: '🎰' },
      { label: 'Create Raffle', href: '/admin/raffles/create', icon: '➕' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Winners & Payouts', href: '/admin/winners', icon: '🏆' },
      { label: 'Operator Wallet', href: '/admin/wallet', icon: '👛' },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Sidebar() {
  const pathname = usePathname();

  /** Check if a nav item is active. Exact match for /admin, startsWith for others. */
  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[240px] bg-[#0a0a0a] border-r border-white/[0.08] flex flex-col z-50">
      {/* Logo / Brand */}
      <div className="h-16 flex items-center px-6 border-b border-white/[0.08]">
        <Link href="/admin" className="flex items-center gap-2 select-none">
          <span className="text-lg font-bold text-white tracking-tight">
            FAIRWIN
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00ff88] bg-[#00ff88]/10 border border-[#00ff88]/20 rounded px-1.5 py-0.5">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#888888] px-3 mb-2">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative
                        ${
                          active
                            ? 'text-[#00ff88] bg-[#00ff88]/[0.08]'
                            : 'text-[#888888] hover:text-white hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      {/* Active right border indicator */}
                      {active && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l bg-[#00ff88]" />
                      )}
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/[0.08] px-6 py-4">
        <Link
          href="/"
          className="text-xs text-[#888888] transition-colors hover:text-white flex items-center gap-2"
        >
          <span>←</span>
          <span>Back to Site</span>
        </Link>
      </div>
    </aside>
  );
}
