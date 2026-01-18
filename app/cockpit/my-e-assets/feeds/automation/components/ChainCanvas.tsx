'use client';

import ChainNode from './ChainNode';
import NodeConnector from './NodeConnector';

interface ChainNode {
  id: string;
  type: 'trigger' | 'content_source' | 'caption' | 'scheduler' | 'dispatch';
  title: string;
  status: string;
  config: Record<string, any>;
}

interface AutomationChain {
  id: string;
  accountId: string;
  status: 'draft' | 'armed' | 'paused';
  nodes: ChainNode[];
}

interface Props {
  chain: AutomationChain;
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}

export default function ChainCanvas({ chain, selectedNodeId, onNodeClick }: Props) {
  return (
    <div className="chain-canvas">
      <div className="chain-flow">
        {chain.nodes.map((node, index) => (
          <div key={node.id} className="chain-flow-item">
            <ChainNode
              node={node}
              isSelected={selectedNodeId === node.id}
              onClick={() => onNodeClick(node.id)}
            />
            {index < chain.nodes.length - 1 && <NodeConnector />}
          </div>
        ))}
      </div>
    </div>
  );
}