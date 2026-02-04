'use client';

import React from 'react';
import CockpitNav from './ui/CockpitNav';
import Ticker from './ui/Ticker';
import BottomDeck from './ui/BottomDeck';

export default function CockpitView({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cockpit-root">
      {/* Top bar */}
      <header className="cockpit-topbar">
        <div className="topbar-left">
          <span className="logo">SOCIAL · EXCHANGE</span>
        </div>

        <div className="topbar-center">
          <Ticker />
        </div>

        <div className="topbar-right">
          <a href="/" className="exit-cockpit">
            Exit Cockpit
          </a>
        </div>
      </header>

      {/* Main body */}
      <div className="cockpit-body">
        <aside className="cockpit-sidebar">
          <CockpitNav />
        </aside>

        <main className="cockpit-main">{children}</main>
      </div>

      {/* Bottom deck */}
      <BottomDeck />
    </div>
  );
}
