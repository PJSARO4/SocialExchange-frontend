'use client';

interface Props {
  onAddNode: (nodeType: string) => void;
}

export default function NodePalette({ onAddNode }: Props) {
  const nodeTypes = [
    { type: 'trigger', label: 'Trigger', icon: '⚡' },
    { type: 'content_source', label: 'Content', icon: '📁' },
    { type: 'caption', label: 'Caption', icon: '✎' },
    { type: 'scheduler', label: 'Schedule', icon: '📅' },
    { type: 'dispatch', label: 'Dispatch', icon: '↗' }
  ];

  return (
    <div className="node-palette">
      <div className="node-palette-header">
        <h3 className="node-palette-title">Add Node</h3>
      </div>
      <div className="node-palette-body">
        {nodeTypes.map(node => (
          <button
            key={node.type}
            className="node-palette-item"
            onClick={() => onAddNode(node.type)}
          >
            <span className="node-palette-icon">{node.icon}</span>
            <span className="node-palette-label">{node.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}