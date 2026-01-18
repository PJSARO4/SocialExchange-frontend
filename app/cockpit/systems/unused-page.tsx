'use client';

import { useEffect, useState } from 'react';
import { getTransactionLog, TransactionLogEntry } from './transactionLog';

export default function SystemsPage() {
  const [log, setLog] = useState<TransactionLogEntry[]>([]);

  useEffect(() => {
    const entries = getTransactionLog();
    setLog([...entries].reverse()); // newest first
  }, []);

  return (
    <section className="cockpit-panel">
      <header className="panel-header">
        <h1>Systems</h1>
        <p className="panel-subtitle">
          Platform telemetry & audit trail
        </p>
      </header>

      <div className="system-log">
        {log.length === 0 && (
          <div className="system-log-empty">
            No system events recorded.
          </div>
        )}

        {log.map((entry) => (
          <div key={entry.id} className="system-log-row">
            <div className="system-log-main">
              <span className="system-log-type">
                {entry.type.toUpperCase()}
              </span>

              {entry.assetId && (
                <span className="system-log-asset">
                  Asset: {entry.assetId}
                </span>
              )}
            </div>

            <div className="system-log-meta">
              <span className="system-log-time">
                {new Date(entry.timestamp).toLocaleString()}
              </span>

              {entry.actorId && (
                <span className="system-log-actor">
                  Actor: {entry.actorId}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
