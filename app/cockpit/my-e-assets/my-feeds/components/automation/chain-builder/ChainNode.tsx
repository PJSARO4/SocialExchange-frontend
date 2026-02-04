'use client';

import React from 'react';
import { ChainNode as ChainNodeType, NODE_CATALOG } from './types';

interface ChainNodeProps {
  node: ChainNodeType;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  onDragStart: (e: React.DragEvent, nodeId: string) => void;
  onDelete: (nodeId: string) => void;
}

export const ChainNode: React.FC<ChainNodeProps> = ({
  node,
  isSelected,
  onSelect,
  onDragStart,
  onDelete,
}) => {
  const catalogItem = NODE_CATALOG.find(item => item.type === node.type);

  if (!catalogItem) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const handleDragStart = (e: React.DragEvent) => {
    onDragStart(e, node.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(node.id);
  };

  return (
    <div
      className={`chain-node ${isSelected ? 'selected' : ''} ${node.data.isConfigured ? 'configured' : 'unconfigured'}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        borderColor: catalogItem.color,
      }}
      draggable
      onClick={handleClick}
      onDragStart={handleDragStart}
    >
      {/* Input Handle */}
      {node.type !== 'start' && (
        <div className="node-handle input" data-handle="input" />
      )}

      {/* Node Header */}
      <div className="node-header" style={{ backgroundColor: catalogItem.color }}>
        <span className="node-icon">{catalogItem.icon}</span>
        <span className="node-type">{catalogItem.label}</span>
        {isSelected && (
          <button className="node-delete" onClick={handleDelete}>×</button>
        )}
      </div>

      {/* Node Body */}
      <div className="node-body">
        <div className="node-label">{node.data.label || 'Configure...'}</div>
        {node.data.description && (
          <div className="node-description">{node.data.description}</div>
        )}
        {!node.data.isConfigured && (
          <div className="node-warning">⚠️ Needs configuration</div>
        )}
      </div>

      {/* Output Handle(s) */}
      {node.type !== 'end' && (
        <>
          {node.type === 'filter' ? (
            <>
              <div className="node-handle output yes" data-handle="yes">
                <span className="handle-label">Yes</span>
              </div>
              <div className="node-handle output no" data-handle="no">
                <span className="handle-label">No</span>
              </div>
            </>
          ) : (
            <div className="node-handle output" data-handle="output" />
          )}
        </>
      )}
    </div>
  );
};

export default ChainNode;
