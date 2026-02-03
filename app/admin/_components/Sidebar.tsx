'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navSections = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    label: 'Raffles',
    items: [
      { href: '/admin/raffles', icon: '🎟️', label: 'All Raffles' },
      { href: '/admin/raffles/create', icon: '➕', label: 'Create Raffle' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { href: '/admin/winners', icon: '🏆', label: 'Winners & Payouts' },
      { href: '/admin/wallet', icon: '💰', label: 'Operator Wallet' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>
          FAIR<span>WIN</span> <span className="badge">Admin</span>
        </h1>
      </div>
      <nav>
        {navSections.map((section) => (
          <div key={section.label} className="nav-section">
            <div className="nav-label">{section.label}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span> {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
