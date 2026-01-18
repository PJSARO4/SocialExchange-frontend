'use client';

interface Node {
  id: string;
  type: 'trigger' | 'content_source' | 'caption' | 'scheduler' | 'dispatch';
  title: string;
  status: string;
  config: Record<string, any>;
}

interface Props {
  node: Node;
  onClose: () => void;
}

export default function ChainInspector({ node, onClose }: Props) {
  const renderConfig = () => {
    const entries = Object.entries(node.config);
    
    if (entries.length === 0) {
      return <div className="inspector-empty">No configuration</div>;
    }

    return entries.map(([key, value]) => (
      <div key={key} className="inspector-config-item">
        <div className="inspector-config-label">{formatLabel(key)}</div>
        <div className="inspector-config-value">{formatValue(value)}</div>
      </div>
    ));
  };

  const formatLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .toUpperCase()
      .trim();
  };

  const formatValue = (value: any) => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="chain-inspector">
      <div className="inspector-header">
        <h3 className="inspector-title">Node Inspector</h3>
        <button className="inspector-close" onClick={onClose}>×</button>
      </div>

      <div className="inspector-body">
        <div className="inspector-section">
          <div className="inspector-section-title">Node Type</div>
          <div className="inspector-section-value">{node.type.replace('_', ' ').toUpperCase()}</div>
        </div>

        <div className="inspector-section">
          <div className="inspector-section-title">Title</div>
          <div className="inspector-section-value">{node.title}</div>
        </div>

        <div className="inspector-section">
          <div className="inspector-section-title">Status</div>
          <div className="inspector-section-value">{node.status}</div>
        </div>

        <div className="inspector-section">
          <div className="inspector-section-title">Configuration</div>
          <div className="inspector-config-list">
            {renderConfig()}
          </div>
        </div>
      </div>

      <div className="inspector-footer">
        <button className="inspector-action-button">Edit Node</button>
        <button className="inspector-action-button danger">Delete Node</button>
      </div>
    </div>
  );
}