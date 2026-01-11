'use client';

import Link from 'next/link';

export default function CockpitHeader() {
  return (
    <header className="cockpit-header">
      <Link href="/cockpit/dashboard" className="cockpit-home">
        ← Mission Control
      </Link>
    </header>
  );
}
