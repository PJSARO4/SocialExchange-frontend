// components/entry/EntryGate.tsx
"use client";

import Link from "next/link";

export default function EntryGate() {
  return (
    <div className="entry-root">
      <div className="entry-core">
        <h1>SOCIAL • EXCHANGE</h1>

        <p className="entry-quote">
          “Markets are systems. Systems require operators.”
        </p>

        <Link href="/cockpit/dashboard" className="entry-button">
          ENTER MISSION CONTROL
        </Link>
      </div>
    </div>
  );
}
