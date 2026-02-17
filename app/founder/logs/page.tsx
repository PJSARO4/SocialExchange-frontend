'use client';

import { useState, useEffect } from 'react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
}

const LEVEL_COLORS: Record<string, string> = {
  info: '#00f0ff',
  warn: '#ff6b35',
  error: '#ff006e',
  debug: '#6b7280',
};

function generateMockLogs(): LogEntry[] {
  const sources = ['auth', 'market', 'cron', 'stripe', 'feeds', 'middleware'];
  const messages: Record<string, string[]> = {
    info: [
      'User session initialized',
      'Market price refresh completed',
      'Cron job executed successfully',
      'Feed sync completed for 3 accounts',
      'New user registration processed',
    ],
    warn: [
      'Rate limit approaching threshold (80%)',
      'Slow query detected: getUserHoldings (450ms)',
      'Instagram API rate limit warning',
      'Cache miss ratio above 30%',
    ],
    error: [
      'Stripe webhook signature verification failed',
      'Database connection pool exhausted',
      'Failed to refresh OAuth token for user_abc123',
    ],
    debug: [
      'WebSocket connection established',
      'Price fluctuation engine tick',
      'Session token refreshed',
    ],
  };

  const logs: LogEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const level = ['info', 'info', 'info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 6)] as LogEntry['level'];
    const levelMessages = messages[level];
    logs.push({
      id: `log-${i}`,
      timestamp: new Date(now - i * 30000 - Math.random() * 15000).toISOString(),
      level,
      source: sources[Math.floor(Math.random() * sources.length)],
      message: levelMessages[Math.floor(Math.random() * levelMessages.length)],
    });
  }

  return logs;
}

export default function FounderLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    setLogs(generateMockLogs());
  }, []);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-mono">System Logs</h1>
        <p className="text-sm text-gray-400">
          Real-time telemetry and event stream. All values simulated during development.
        </p>
      </header>

      <div className="flex gap-2">
        {['all', 'info', 'warn', 'error', 'debug'].map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className="text-xs font-mono px-3 py-1 border border-gray-700 rounded"
            style={{
              background: filter === level ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              borderColor: filter === level ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255,255,255,0.1)',
              color: filter === level ? '#00f0ff' : '#9ca3af',
            }}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      <div
        className="border border-gray-800 rounded-lg overflow-hidden"
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th className="text-left px-3 py-2 text-gray-500 font-mono text-xs">TIME</th>
              <th className="text-left px-3 py-2 text-gray-500 font-mono text-xs">LEVEL</th>
              <th className="text-left px-3 py-2 text-gray-500 font-mono text-xs">SOURCE</th>
              <th className="text-left px-3 py-2 text-gray-500 font-mono text-xs">MESSAGE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-b border-gray-800/50 hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="font-mono text-xs font-semibold px-2 py-0.5 rounded"
                    style={{
                      color: LEVEL_COLORS[log.level],
                      background: `${LEVEL_COLORS[log.level]}15`,
                    }}
                  >
                    {log.level.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-400">{log.source}</td>
                <td className="px-3 py-2 text-gray-300 text-xs">{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-600 font-mono">
        Showing {filtered.length} of {logs.length} entries
      </p>
    </div>
  );
}
