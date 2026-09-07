'use client';

import { Component, ReactNode, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CommsProvider } from './context/CommsContext';
import ChannelList from './components/ChannelList';
import RightPanel from './components/RightPanel';
import './comms.css';

// Error boundary to prevent comms crashes from killing the entire cockpit
class CommsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="comms-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(248, 113, 113, 0.05)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: '8px',
            maxWidth: '400px',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}><AlertTriangle size={24} /></div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem', letterSpacing: '1px' }}>
              COMMS MODULE ERROR
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>
              {this.state.error || 'An unexpected error occurred'}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: '' });
              }}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'rgba(63, 255, 220, 0.1)',
                border: '1px solid rgba(63, 255, 220, 0.3)',
                borderRadius: '6px',
                color: '#3fffdc',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                letterSpacing: '1px',
              }}
            >
              RETRY
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function CommsPage() {
  return (
    <CommsErrorBoundary>
      <CommsProvider>
        <CommsInner />
      </CommsProvider>
    </CommsErrorBoundary>
  );
}

type CommsTab = 'inbox' | 'opportunities' | 'partnerships' | 'notifications';

function CommsInner() {
  const [tab, setTab] = useState<CommsTab>('inbox');

  const TABS: { id: CommsTab; label: string }[] = [
    { id: 'inbox', label: 'Inbox' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'partnerships', label: 'Partnerships' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const PLACEHOLDER: Record<Exclude<CommsTab, 'inbox'>, { title: string; body: string }> = {
    opportunities: { title: 'Opportunities', body: 'Inbound deal flow — brand collabs, sponsorships and paid asks — will collect here as your accounts grow.' },
    partnerships: { title: 'Partnerships', body: 'Active partnerships and their terms live here. Accept a deal from Opportunities and it graduates to this tab.' },
    notifications: { title: 'Notifications', body: 'Mentions, new followers of note, and system alerts across your fleet will surface here.' },
  };

  return (
    <div className="comms-page comms-redesign">
      {/* LIVING STATION LIGHTS (over the backdrop, behind content) */}
      <div className="comms-lights" aria-hidden="true">
        {Array.from({ length: 16 }).map((_, i) => (
          <span key={i} className={`cl cl-${i + 1}`} />
        ))}
        <span className="cl-beacon" />
      </div>

      {/* HERO */}
      <header className="comms-hero">
        <div className="comms-hero-main">
          <h1 className="comms-title">COMMS</h1>
          <p className="comms-subtitle">REAL CONVERSATIONS. REAL OPPORTUNITIES.</p>
        </div>
        <div className="comms-hero-tag">
          RELATIONSHIPS<br />EXPAND REALMS
        </div>
      </header>

      {/* TABS */}
      <nav className="comms-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`comms-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'inbox' ? (
        <div className="comms-layout">
          <aside className="comms-left-panel">
            <ChannelList />
          </aside>
          <main className="comms-main-panel">
            <RightPanel />
          </main>
        </div>
      ) : (
        <div className="comms-tabpane">
          <div className="comms-tabpane-icon">◎</div>
          <h2 className="comms-tabpane-title">{PLACEHOLDER[tab].title}</h2>
          <p className="comms-tabpane-body">{PLACEHOLDER[tab].body}</p>
        </div>
      )}
    </div>
  );
}
