// components/MissionControlShell.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";

export default function MissionControlShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="mission-control">

      {/* LEFT COMMS */}
      <aside className="comms-panel">
        <div className="comms-header">COMMS</div>
        <nav className="comms-channels">
          <span># general</span>
          <span># market</span>
          <span># escrow</span>
          <span>@ direct</span>
        </nav>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="main-panel">
        {children}
      </main>

      {/* BOTTOM DOCK */}
      <footer className="bottom-dock">
        <Link href="/cockpit/comms">COMMS</Link>
        <Link href="/cockpit/assets">ASSETS</Link>
        <Link href="/cockpit/trade">TRADE</Link>
        <span className="system-status">SYSTEM ONLINE</span>
      </footer>

    </div>
  );
}
