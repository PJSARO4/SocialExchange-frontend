'use client';

import { Component, ReactNode } from 'react';
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
            <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚠️</div>
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
        <div className="comms-page">
          <header className="comms-header">
            <h1 className="comms-title">COMMUNICATIONS</h1>
            <div className="comms-status-bar">
              <span className="comms-status-indicator">ONLINE</span>
            </div>
          </header>

          <div className="comms-layout">
            <aside className="comms-left-panel">
              <ChannelList />
            </aside>

            <main className="comms-main-panel">
              <RightPanel />
            </main>
          </div>
        </div>
      </CommsProvider>
    </CommsErrorBoundary>
  );
}
