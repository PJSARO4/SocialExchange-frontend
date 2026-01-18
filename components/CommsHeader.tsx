import Link from 'next/link';

export default function CockpitHeader() {
  return (
    <header className="cockpit-header">
      <div className="cockpit-header-left">
        <div className="cockpit-logo">SOCIAL · EXCHANGE</div>
        <nav className="cockpit-header-nav">
          <Link href="/cockpit/dashboard">Dashboard</Link>
          <Link href="/cockpit/assets">Assets</Link>
          <Link href="/cockpit/market">Market</Link>
          <Link href="/cockpit/comms">Comms</Link>
        </nav>
      </div>

      <nav className="cockpit-header-nav">
        <Link href="/">Exit Cockpit</Link>
      </nav>
    </header>
  );
}
