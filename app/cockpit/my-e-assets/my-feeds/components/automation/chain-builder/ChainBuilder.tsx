'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ChainNode as ChainNodeType,
  NodeConnection,
  AutomationChain,
  NODE_CATALOG,
  NodeType,
  NodeCatalogItem,
} from './types';
// Note: ChainNode is now rendered inline for better control over connection handles
import NodeConfigPanel from './NodeConfigPanel';
import './chain-builder.css';

interface ChainBuilderProps {
  chain?: AutomationChain;
  feedId: string;
  feedHandle: string;
  onSave: (chain: AutomationChain) => void;
  onClose: () => void;
}

// Connection preview line component
const ConnectionPreview: React.FC<{
  sourceNode: ChainNodeType;
  sourceHandle: 'output' | 'yes' | 'no';
  mousePos: { x: number; y: number };
  canvasOffset: { x: number; y: number };
  zoom: number;
  canvasRect: DOMRect;
}> = ({ sourceNode, sourceHandle, mousePos, canvasOffset, zoom, canvasRect }) => {
  if (!sourceNode) return null;

  const sourceX = sourceNode.position.x + 200; // Node width
  const sourceY = sourceNode.position.y + (
    sourceHandle === 'yes' ? 70 :
    sourceHandle === 'no' ? 110 : 75
  );

  // Convert mouse position to canvas coordinates
  const targetX = (mousePos.x - canvasRect.left - canvasOffset.x) / zoom;
  const targetY = (mousePos.y - canvasRect.top - canvasOffset.y) / zoom;

  const midX = (sourceX + targetX) / 2;

  const path = `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;

  return (
    <path
      d={path}
      className="connection-drawing"
      fill="none"
      stroke="rgba(63, 255, 220, 0.6)"
      strokeWidth="2"
      strokeDasharray="8,4"
    />
  );
};

export const ChainBuilder: React.FC<ChainBuilderProps> = ({
  chain,
  feedId,
  feedHandle,
  onSave,
  onClose,
}) => {
  // Canvas state
  const canvasRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Chain state
  const [nodes, setNodes] = useState<ChainNodeType[]>(chain?.nodes || []);
  const [connections, setConnections] = useState<NodeConnection[]>(chain?.connections || []);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [chainName, setChainName] = useState(chain?.name || 'New Automation Chain');
  const [chainEnabled, setChainEnabled] = useState(chain?.enabled ?? false);

  // Connection drawing state - click-based approach
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    handle: 'output' | 'yes' | 'no';
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodeStartPos, setNodeStartPos] = useState({ x: 0, y: 0 });

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  // Generate unique ID
  const generateId = () => `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Add node from catalog
  const handleAddNode = (catalogItem: NodeCatalogItem) => {
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    const centerX = canvasRect ? (canvasRect.width / 2 - canvasOffset.x) / zoom : 400;
    const centerY = canvasRect ? (canvasRect.height / 2 - canvasOffset.y) / zoom : 300;

    const newNode: ChainNodeType = {
      id: generateId(),
      type: catalogItem.type,
      position: {
        x: centerX - 100 + Math.random() * 50,
        y: centerY - 50 + Math.random() * 50,
      },
      data: {
        label: catalogItem.label,
        description: '',
        isConfigured: false,
      },
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(
      c => c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
    ));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  // Update node data
  const handleUpdateNode = (nodeId: string, data: Partial<ChainNodeType['data']>) => {
    setNodes(prev => prev.map(node =>
      node.id === nodeId
        ? { ...node, data: { ...node.data, ...data } }
        : node
    ));
  };

  // Handle output handle click - start connection
  const handleOutputClick = (nodeId: string, handle: 'output' | 'yes' | 'no') => {
    console.log('[ChainBuilder] Output clicked:', nodeId, handle, 'Current connectingFrom:', connectingFrom);
    if (connectingFrom) {
      // Already connecting, cancel
      setConnectingFrom(null);
    } else {
      // Start connection from this output
      setConnectingFrom({ nodeId, handle });
    }
  };

  // Handle input handle click - complete connection
  const handleInputClick = (nodeId: string) => {
    console.log('[ChainBuilder] Input clicked:', nodeId, 'connectingFrom:', connectingFrom);
    if (connectingFrom && connectingFrom.nodeId !== nodeId) {
      // Check if connection already exists
      const exists = connections.some(
        c => c.sourceNodeId === connectingFrom.nodeId &&
             c.sourceHandle === connectingFrom.handle &&
             c.targetNodeId === nodeId
      );

      if (!exists) {
        const newConnection: NodeConnection = {
          id: `conn-${Date.now()}`,
          sourceNodeId: connectingFrom.nodeId,
          sourceHandle: connectingFrom.handle,
          targetNodeId: nodeId,
          targetHandle: 'input',
        };
        console.log('[ChainBuilder] Creating connection:', newConnection);
        setConnections(prev => [...prev, newConnection]);
      }
    }
    setConnectingFrom(null);
  };

  // Cancel connection on escape or canvas click
  const cancelConnection = () => {
    setConnectingFrom(null);
  };

  // Handle mouse move for connection line preview and node dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });

    // Handle panning
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setCanvasOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }

    // Handle node dragging
    if (draggingNodeId && gridRef.current) {
      const gridRect = gridRef.current.getBoundingClientRect();
      const x = nodeStartPos.x + (e.clientX - dragStart.x) / zoom;
      const y = nodeStartPos.y + (e.clientY - dragStart.y) / zoom;

      setNodes(prev => prev.map(node =>
        node.id === draggingNodeId
          ? { ...node, position: { x, y } }
          : node
      ));
    }
  }, [isPanning, panStart, draggingNodeId, dragStart, nodeStartPos, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingNodeId(null);
  }, []);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelConnection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Canvas panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === canvasRef.current || target.classList.contains('canvas-grid') || target.tagName === 'svg') {
      if (connectingFrom) {
        cancelConnection();
      } else {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
        setSelectedNodeId(null);
      }
    }
  };

  // Node dragging
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    // Don't start drag if clicking on a handle
    const target = e.target as HTMLElement;
    if (target.classList.contains('node-handle')) return;

    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
    setNodeStartPos({ x: node.position.x, y: node.position.y });
    setSelectedNodeId(nodeId);
  };

  // Zoom
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.min(2, Math.max(0.5, prev + delta)));
  };

  // Attach global mouse listeners
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Calculate connection paths
  const getConnectionPath = (connection: NodeConnection) => {
    const sourceNode = nodes.find(n => n.id === connection.sourceNodeId);
    const targetNode = nodes.find(n => n.id === connection.targetNodeId);
    if (!sourceNode || !targetNode) return '';

    const sourceX = sourceNode.position.x + 200; // Node width
    const sourceY = sourceNode.position.y + (
      connection.sourceHandle === 'yes' ? 70 :
      connection.sourceHandle === 'no' ? 110 : 75
    );
    const targetX = targetNode.position.x;
    const targetY = targetNode.position.y + 75; // Center of node height

    const midX = (sourceX + targetX) / 2;

    return `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${midX} ${targetY}, ${targetX} ${targetY}`;
  };

  // Save chain
  const handleSave = () => {
    const updatedChain: AutomationChain = {
      id: chain?.id || generateId(),
      name: chainName,
      feedId,
      nodes,
      connections,
      enabled: chainEnabled,
      createdAt: chain?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: chain?.runCount || 0,
      status: nodes.every(n => n.data.isConfigured) ? 'active' : 'draft',
    };
    onSave(updatedChain);
  };

  // Group nodes by category for sidebar
  const nodesByCategory = NODE_CATALOG.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NodeCatalogItem[]>);

  return (
    <div className="chain-builder">
      {/* Header */}
      <div className="builder-header">
        <div className="builder-title">
          <button className="back-btn" onClick={onClose}>←</button>
          <input
            type="text"
            value={chainName}
            onChange={e => setChainName(e.target.value)}
            className="chain-name-input"
          />
          <span className="chain-feed">@{feedHandle}</span>
        </div>
        <div className="builder-actions">
          <div className="chain-toggle">
            <span>{chainEnabled ? 'Enabled' : 'Disabled'}</span>
            <button
              className={`toggle-switch ${chainEnabled ? 'on' : ''}`}
              onClick={() => setChainEnabled(!chainEnabled)}
            >
              <span className="toggle-knob"></span>
            </button>
          </div>
          <button className="test-btn">▶ Test Run</button>
          <button className="save-btn" onClick={handleSave}>💾 Save Chain</button>
        </div>
      </div>

      <div className="builder-body">
        {/* Node Catalog Sidebar */}
        <div className="node-catalog">
          <div className="catalog-header">
            <h3>Nodes</h3>
            <p>Drag to add</p>
          </div>

          {Object.entries(nodesByCategory).map(([category, items]) => (
            <div key={category} className="catalog-category">
              <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
              <div className="catalog-items">
                {items.map(item => (
                  <button
                    key={item.type}
                    className="catalog-item"
                    style={{ borderColor: item.color }}
                    onClick={() => handleAddNode(item)}
                  >
                    <span className="item-icon">{item.icon}</span>
                    <span className="item-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`builder-canvas ${connectingFrom ? 'connecting' : ''}`}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
        >
          <div
            ref={gridRef}
            className="canvas-grid"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
            }}
          >
            {/* Connections */}
            <svg className="connections-layer">
              {connections.map(conn => (
                <path
                  key={conn.id}
                  d={getConnectionPath(conn)}
                  className="connection-line"
                  onClick={() => setConnections(prev => prev.filter(c => c.id !== conn.id))}
                />
              ))}
              {/* Drawing connection preview */}
              {connectingFrom && canvasRef.current && (
                <ConnectionPreview
                  sourceNode={nodes.find(n => n.id === connectingFrom.nodeId)!}
                  sourceHandle={connectingFrom.handle}
                  mousePos={mousePos}
                  canvasOffset={canvasOffset}
                  zoom={zoom}
                  canvasRect={canvasRef.current.getBoundingClientRect()}
                />
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => {
              const catalogItem = NODE_CATALOG.find(item => item.type === node.type);
              return (
                <div
                  key={node.id}
                  className={`chain-node ${selectedNodeId === node.id ? 'selected' : ''} ${node.data.isConfigured ? 'configured' : 'unconfigured'} ${connectingFrom?.nodeId === node.id ? 'connecting-from' : ''}`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    borderColor: catalogItem?.color,
                  }}
                  data-node-id={node.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  {/* Input Handle */}
                  {node.type !== 'start' && (
                    <div
                      className={`node-handle input ${connectingFrom ? 'highlight-target' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInputClick(node.id);
                      }}
                    />
                  )}

                  {/* Node Header */}
                  <div className="node-header" style={{ backgroundColor: catalogItem?.color }}>
                    <span className="node-icon">{catalogItem?.icon}</span>
                    <span className="node-type">{catalogItem?.label}</span>
                    {selectedNodeId === node.id && (
                      <button
                        className="node-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNode(node.id);
                        }}
                      >
                        ×
                      </button>
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
                          <div
                            className={`node-handle output yes ${connectingFrom?.nodeId === node.id && connectingFrom?.handle === 'yes' ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOutputClick(node.id, 'yes');
                            }}
                          >
                            <span className="handle-label">Yes</span>
                          </div>
                          <div
                            className={`node-handle output no ${connectingFrom?.nodeId === node.id && connectingFrom?.handle === 'no' ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOutputClick(node.id, 'no');
                            }}
                          >
                            <span className="handle-label">No</span>
                          </div>
                        </>
                      ) : (
                        <div
                          className={`node-handle output ${connectingFrom?.nodeId === node.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOutputClick(node.id, 'output');
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {nodes.length === 0 && (
              <div className="canvas-empty">
                <div className="empty-content">
                  <span className="empty-icon">🔗</span>
                  <h3>Start Building Your Chain</h3>
                  <p>Click nodes from the sidebar to add them to the canvas</p>
                  <button
                    className="quick-start-btn"
                    onClick={() => handleAddNode(NODE_CATALOG.find(n => n.type === 'start')!)}
                  >
                    + Add Start Node
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Connection mode indicator */}
          {connectingFrom && (
            <div className="connection-hint">
              Click on an input handle (left side) to connect, or press ESC to cancel
            </div>
          )}

          {/* Zoom controls */}
          <div className="zoom-controls">
            <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}>+</button>
            <span>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}>−</button>
            <button onClick={() => { setZoom(1); setCanvasOffset({ x: 0, y: 0 }); }}>⌂</button>
          </div>
        </div>

        {/* Config Panel */}
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={handleUpdateNode}
          onClose={() => setSelectedNodeId(null)}
        />
      </div>
    </div>
  );
};

export default ChainBuilder;
