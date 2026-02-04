'use client';

import { CommsProvider } from './context/CommsContext';
import ChannelList from './components/ChannelList';
import RightPanel from './components/RightPanel';
import './comms.css';

export default function CommsPage() {
  return (
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
  );
}