"use client";

import Link from "next/link";

export default function CockpitHeader() {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ letterSpacing: "0.3em" }}>SOCIAL • EXCHANGE</div>

      <nav style={{ display: "flex", gap: "2rem" }}>
        <Link href="/cockpit/dashboard">Dashboard</Link>
        <Link href="/cockpit/assets">Assets</Link>
        <Link href="/cockpit/market">Market</Link>
        <Link href="/cockpit/comms">Comms</Link>
      </nav>

      <Link href="/">Exit Cockpit</Link>
    </header>
  );
}
