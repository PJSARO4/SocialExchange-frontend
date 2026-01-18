"use client";

import { useEffect, useState } from "react";

type LogEntry = {
  id: string;
  createdAt: string;
  category: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
};

export default function LogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/logs");
        if (!res.ok) throw new Error("Log fetch failed");
        const data = await res.json();
        setLogs(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  return (
    <div className="deck-panel">
      <div className="deck-header">SYSTEM LOGS</div>

      <div className="deck-content">
        {loading && <div>Loading logs…</div>}
        {error && <div>Logs unavailable.</div>}
        {!loading && !error && logs.length === 0 && (
          <div>No logs available.</div>
        )}

        {logs.map((log) => (
          <div
            key={log.id}
            className={`log-entry ${
              expandedId === log.id ? "expanded" : ""
            }`}
            onClick={() =>
              setExpandedId(expandedId === log.id ? null : log.id)
            }
          >
            <div className="log-line">
              <span className="log-time">
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
              <span className="log-category">{log.category}</span>
              <span className="log-message">{log.message}</span>
            </div>

            {expandedId === log.id && log.context && (
              <pre className="log-context">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
