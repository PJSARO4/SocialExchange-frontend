'use client';

import { Feed } from '../types/feed';

export default function AutomationStatusPanel({ feed }: { feed: Feed }) {
  return (
    <div className="automation-state-panel">
      <div className="automation-panel-header">
        <h3 className="automation-panel-title">SYSTEM STATUS</h3>
      </div>

      <div className={`automation-toggle ${feed.automationEnabled ? 'armed' : 'disarmed'}`}>
        <span className="automation-toggle-indicator">⦿</span>
        <span className="automation-toggle-label">
          {feed.automationEnabled ? 'ARMED' : 'IDLE'}
        </span>
      </div>
    </div>
  );
}
