'use client';

import LogsPanel from '../ui/LogsPanel';

export default function SystemsPage() {
  return (
    <section className="cockpit-panel">
      <header className="panel-header">
        <h1>System Logs</h1>
        <p className="panel-subtitle">
          Platform telemetry and audit trail
        </p>
      </header>

      <LogsPanel />
    </section>
  );
}
