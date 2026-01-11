"use client";

import { useRouter, usePathname } from "next/navigation";

export default function CockpitView() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="cockpit-root">
      {/* LEFT SYSTEM STRIP */}
      <aside className="cockpit-left">
        <div className="cockpit-title">COMMS</div>
        <div className="cockpit-channel"># general</div>
        <div className="cockpit-channel"># market</div>
        <div className="cockpit-channel"># escrow</div>
        <div className="cockpit-channel">@ direct</div>
      </aside>

      {/* MAIN PANEL */}
      <main className="cockpit-main">
        <header className="cockpit-header">
          <span>MISSION CONTROL</span>
          <span className="system-status">SYSTEM ONLINE</span>
        </header>

        <section className="cockpit-content">
          {pathname.includes("/dashboard") && (
            <>
              <h1>Dashboard</h1>
              <p>System Status</p>
              <p>Active Listings</p>
              <p>Messages</p>
            </>
          )}
        </section>
      </main>

      {/* BOTTOM NAV */}
      <footer className="cockpit-footer">
        <button onClick={() => router.push("/cockpit/comms")}>COMMS</button>
        <button onClick={() => router.push("/cockpit/assets")}>ASSETS</button>
        <button onClick={() => router.push("/cockpit/trade")}>TRADE</button>
        <button onClick={() => router.push("/cockpit/escrow")}>ESCROW</button>
      </footer>
    </div>
  );
}
