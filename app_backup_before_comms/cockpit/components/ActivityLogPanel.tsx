'use client';

interface Props {
  logs: Array<{
    id: number;
    time: string;
    event: string;
    user: string;
  }>;
}

export default function ActivityLogPanel({ logs }: Props) {
  return (
    <div className="panel panel-activity-log">
      <div className="panel-header">
        <h2 className="panel-title">Activity Log</h2>
        <span className="panel-status status-live">● LIVE</span>
      </div>
      <div className="panel-body">
        {logs.map(log => (
          <div key={log.id} className="activity-log-item">
            <div className="activity-log-content">
              <span className="activity-log-time">{log.time}</span>
              <span className="activity-log-event">{log.event}</span>
            </div>
            <span className="activity-log-user">{log.user}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
