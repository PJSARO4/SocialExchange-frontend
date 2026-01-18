'use client';

interface Node {
  id: string;
  type: 'trigger' | 'content_source' | 'caption' | 'scheduler' | 'dispatch';
  title: string;
  status: string;
}

interface Props {
  node: Node;
  isSelected: boolean;
  onClick: () => void;
}

export default function ChainNode({ node, isSelected, onClick }: Props) {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return '⚡';
      case 'content_source':
        return '📁';
      case 'caption':
        return '✎';
      case 'scheduler':
        return '📅';
      case 'dispatch':
        return '↗';
      default:
        return '●';
    }
  };

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case 'trigger':
        return 'TRIGGER';
      case 'content_source':
        return 'CONTENT';
      case 'caption':
        return 'CAPTION';
      case 'scheduler':
        return 'SCHEDULE';
      case 'dispatch':
        return 'DISPATCH';
      default:
        return 'NODE';
    }
  };

  return (
    <div
      className={`chain-node ${isSelected ? 'selected' : ''} node-type-${node.type}`}
      onClick={onClick}
    >
      <div className="chain-node-header">
        <span className="chain-node-icon">{getNodeIcon(node.type)}</span>
        <span className="chain-node-type">{getNodeTypeLabel(node.type)}</span>
      </div>
      <div className="chain-node-body">
        <div className="chain-node-title">{node.title}</div>
        <div className="chain-node-status">{node.status}</div>
      </div>
    </div>
  );
}