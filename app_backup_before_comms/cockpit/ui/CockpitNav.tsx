'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/cockpit/dashboard' },
  { label: 'Assets', href: '/cockpit/assets' },
  { label: 'Market', href: '/cockpit/market' },
  { label: 'Comms', href: '/cockpit/comms' },
  { label: 'Systems', href: '/cockpit/systems' },
];

export default function CockpitNav() {
  const pathname = usePathname();

  return (
    <nav className="cockpit-nav">
      <div className="nav-section-title">Navigation</div>

      {NAV_ITEMS.map(item => {
        const isActive = pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            {isActive && <span className="active-indicator" />}
            <span className="label">{item.label}</span>
          </Link>
        );
      })}

      <div className="nav-divider" />

      <div className="system-status">
        <span className="status-label">System Status</span>
        <span className="status-value">STABLE</span>
      </div>
    </nav>
  );
}
