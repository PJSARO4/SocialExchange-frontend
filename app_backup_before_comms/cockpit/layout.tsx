'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import './cockpit.css';

import Ticker from './ui/Ticker';
import LogsPanel from './ui/LogsPanel';

export default function CockpitLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [powerState, setPowerState] = useState<'ACTIVE' | 'CRUISE'>('ACTIVE');
  const [logsOpen, setLogsOpen] = useState(false);
  const [signalOpen, setSignalOpen] = useState(false);

  const togglePower = () => {
    setPowerState(prev => (prev === 'ACTIVE' ? 'CRUISE' : 'ACTIVE'));
    setLogsOpen(false);
    setSignalOpen(false);
  };

  return (
    <div className={`cockpit-root ${powerState === 'CRUISE' ? 'cruise-mode' : ''}`}>
      {/* TOP BAR */}
      <header className="cockpit-topbar">
        <div className="logo">SOCIAL · EXCHANGE</div>
        <div className="topbar-center">
          <Ticker />
        </div>
        <div className="exit-cockpit">
          <Link href="/">Exit Cockpit</Link>
        </div>
      </header>

      {/* BODY */}
      <div className="cockpit-body">
        <aside className="cockpit-sidebar">
          <div className="sidebar-title">NAVIGATION</div>

          <Link
            href="/cockpit/dashboard"
            className={`sidebar-link ${
              pathname === '/cockpit/dashboard' ? 'active' : ''
            }`}
          >
            Command Center
          </Link>

          <Link
            href="/cockpit/my-e-assets"
            className={`sidebar-link ${
              pathname === '/cockpit/my-e-assets' ? 'active' : ''
            }`}
          >
            My E-Assets
          </Link>

          <Link
            href="/cockpit/trading-post"
            className={`sidebar-link ${
              pathname === '/cockpit/trading-post' ? 'active' : ''
            }`}
          >
            Trading Post
          </Link>

          <Link
            href="/cockpit/market"
            className={`sidebar-link ${
              pathname === '/cockpit/market' ? 'active' : ''
            }`}
          >
            Market
          </Link>

          <Link
            href="/cockpit/comms"
            className={`sidebar-link ${
              pathname === '/cockpit/comms' ? 'active' : ''
            }`}
          >
            Comms
          </Link>

          <div className="sidebar-footer">
            System Status <span className="status-ok">STABLE</span>
          </div>
        </aside>

        <main className="cockpit-main">{children}</main>
      </div>

      {/* FOOTER */}
      <footer className="cockpit-footer">
        <span
          className={`footer-tab ${logsOpen ? 'active' : ''}`}
          onClick={() => setLogsOpen(v => !v)}
        >
          LOGS
        </span>

        <span
          className={`power-button ${
            powerState === 'CRUISE' ? 'active' : ''
          }`}
          onClick={togglePower}
        >
          {powerState === 'CRUISE' ? 'CRUISE' : 'POWER'}
        </span>

        <span
          className={`footer-tab ${signalOpen ? 'active' : ''}`}
          onClick={() => setSignalOpen(v => !v)}
        >
          SIGNAL
        </span>
      </footer>

      {/* PANELS */}
      {logsOpen && <LogsPanel />}
    </div>
  );
}
