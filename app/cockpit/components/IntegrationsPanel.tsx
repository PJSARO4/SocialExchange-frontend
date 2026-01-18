'use client';

interface Props {
  integrations: Array<{
    name: string;
    status: 'active' | 'inactive' | 'pending';
    lastSync: string;
  }>;
}

export default function IntegrationsPanel({ integrations }: Props) {
  return (
    <div className="panel panel-integrations">
      <div className="panel-header">
        <h2 className="panel-title">E-Feeds & Integrations</h2>
      </div>
      <div className="panel-body integrations-grid">
        {integrations.map((integration, idx) => (
          <div key={idx} className="integration-card">
            <div className="integration-name">{integration.name}</div>
            <div className={`integration-status status-${integration.status}`}>
              ● {integration.status}
            </div>
            <div className="integration-sync">{integration.lastSync}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
