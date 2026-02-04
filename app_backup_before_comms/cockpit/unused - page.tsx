import Link from 'next/link';
import './entry.css';

export default function EntryPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#ffffff',
        color: '#000000',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <h1 style={{ letterSpacing: '0.15em', marginBottom: '20px' }}>
        SOCIAL • EXCHANGE
      </h1>

      <Link
        href="/cockpit/dashboard"
        style={{
          padding: '8px 16px',
          border: '1px solid #333',
          textDecoration: 'none',
          color: '#000',
          marginBottom: '12px',
        }}
      >
        ENTER MISSION CONTROL
      </Link>

      <p style={{ opacity: 0.6 }}>SYSTEM STANDBY</p>
    </main>
  );
}
