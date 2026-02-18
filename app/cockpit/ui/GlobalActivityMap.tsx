"use client";

import { useEffect, useState, useRef } from "react";

// ============================================
// TYPES
// ============================================

interface AgentNode {
  id: string;
  label: string;
  region: string;
  x: number; // % position on map
  y: number;
  status: "online" | "offline" | "syncing";
  lastPing: number;
}

interface PingEvent {
  id: string;
  nodeId: string;
  x: number;
  y: number;
  timestamp: number;
}

// ============================================
// AGENT NODES — global distribution
// ============================================

const AGENT_NODES: AgentNode[] = [
  // North America
  { id: "na-1", label: "NYC-01", region: "NA East", x: 24, y: 32, status: "online", lastPing: 0 },
  { id: "na-2", label: "LAX-01", region: "NA West", x: 12, y: 36, status: "offline", lastPing: 0 },
  { id: "na-3", label: "CHI-01", region: "NA Central", x: 19, y: 32, status: "offline", lastPing: 0 },
  // South America
  { id: "sa-1", label: "SAO-01", region: "SA East", x: 30, y: 68, status: "offline", lastPing: 0 },
  // Europe
  { id: "eu-1", label: "LDN-01", region: "EU West", x: 47, y: 26, status: "online", lastPing: 0 },
  { id: "eu-2", label: "FRA-01", region: "EU Central", x: 50, y: 28, status: "offline", lastPing: 0 },
  { id: "eu-3", label: "STO-01", region: "EU North", x: 52, y: 20, status: "offline", lastPing: 0 },
  // Africa
  { id: "af-1", label: "JNB-01", region: "AF South", x: 54, y: 65, status: "offline", lastPing: 0 },
  // Middle East
  { id: "me-1", label: "DXB-01", region: "ME", x: 60, y: 38, status: "offline", lastPing: 0 },
  // Asia
  { id: "as-1", label: "TKY-01", region: "AS East", x: 82, y: 34, status: "online", lastPing: 0 },
  { id: "as-2", label: "SGP-01", region: "AS SE", x: 76, y: 52, status: "offline", lastPing: 0 },
  { id: "as-3", label: "MUM-01", region: "AS South", x: 67, y: 42, status: "offline", lastPing: 0 },
  // Oceania
  { id: "oc-1", label: "SYD-01", region: "OC", x: 85, y: 68, status: "offline", lastPing: 0 },
];

// ============================================
// COMPONENT
// ============================================

export default function GlobalActivityMap() {
  const [nodes, setNodes] = useState<AgentNode[]>(AGENT_NODES);
  const [pings, setPings] = useState<PingEvent[]>([]);
  const [onlineCount, setOnlineCount] = useState(3);
  const tickRef = useRef(0);

  // Simulate agents coming online/offline + ping events
  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current++;

      setNodes((prev) => {
        const updated = prev.map((node) => ({ ...node }));

        // Every tick, randomly toggle 1-2 agents
        const toggleCount = Math.random() < 0.3 ? 2 : 1;
        for (let i = 0; i < toggleCount; i++) {
          const idx = Math.floor(Math.random() * updated.length);
          const node = updated[idx];

          if (node.status === "offline" && Math.random() < 0.4) {
            node.status = "syncing";
            node.lastPing = Date.now();
          } else if (node.status === "syncing") {
            node.status = "online";
            node.lastPing = Date.now();
          } else if (node.status === "online" && Math.random() < 0.15) {
            node.status = "offline";
          }
        }

        // Generate ping from a random online node
        const onlineNodes = updated.filter((n) => n.status === "online");
        if (onlineNodes.length > 0) {
          const pingNode = onlineNodes[Math.floor(Math.random() * onlineNodes.length)];
          setPings((prev) => [
            ...prev.slice(-6), // keep max 6 active pings
            {
              id: `ping-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              nodeId: pingNode.id,
              x: pingNode.x,
              y: pingNode.y,
              timestamp: Date.now(),
            },
          ]);
        }

        setOnlineCount(updated.filter((n) => n.status === "online").length);
        return updated;
      });

      // Clean old pings
      setPings((prev) => prev.filter((p) => Date.now() - p.timestamp < 3000));
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="global-map">
      {/* Status label */}
      <div className="global-map-status">
        <span className="global-map-dot" />
        <span className="global-map-count">{onlineCount}</span>
        <span className="global-map-label">NODES</span>
      </div>

      {/* SVG Map */}
      <svg
        className="global-map-svg"
        viewBox="0 0 100 80"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* World outline — simplified continents */}
        <g className="global-map-land" opacity="0.12">
          {/* North America */}
          <path d="M8,18 L12,14 L18,12 L24,14 L28,18 L30,24 L28,30 L26,36 L22,40 L18,42 L14,40 L10,36 L8,30 Z" />
          {/* Central America */}
          <path d="M18,42 L20,44 L22,48 L20,50 L18,48 Z" />
          {/* South America */}
          <path d="M22,50 L26,48 L30,52 L34,56 L34,62 L32,68 L28,74 L24,72 L22,66 L24,60 L22,54 Z" />
          {/* Europe */}
          <path d="M44,16 L48,14 L52,16 L56,18 L56,24 L54,28 L50,30 L46,28 L44,24 Z" />
          {/* Africa */}
          <path d="M46,32 L50,30 L54,32 L58,36 L58,44 L56,52 L54,58 L52,64 L48,66 L46,60 L44,52 L44,44 L46,38 Z" />
          {/* Middle East */}
          <path d="M56,28 L60,26 L64,30 L62,36 L58,36 L56,32 Z" />
          {/* Asia */}
          <path d="M56,12 L62,10 L68,12 L74,14 L80,16 L84,20 L86,26 L84,32 L80,36 L76,38 L72,36 L68,34 L64,30 L60,26 L56,20 Z" />
          {/* India */}
          <path d="M64,34 L68,34 L70,40 L68,48 L64,46 L62,40 Z" />
          {/* SE Asia */}
          <path d="M72,38 L76,38 L80,42 L78,48 L74,50 L72,46 Z" />
          {/* Japan */}
          <path d="M82,26 L84,24 L86,28 L84,32 L82,30 Z" />
          {/* Australia */}
          <path d="M78,58 L84,56 L90,58 L92,62 L90,68 L86,70 L80,68 L78,64 Z" />
        </g>

        {/* Connection lines between online nodes */}
        <g className="global-map-connections">
          {nodes
            .filter((n) => n.status === "online")
            .map((node, i, arr) => {
              if (i === 0) return null;
              const prev = arr[i - 1];
              return (
                <line
                  key={`conn-${node.id}-${prev.id}`}
                  x1={prev.x}
                  y1={prev.y}
                  x2={node.x}
                  y2={node.y}
                  stroke="rgba(63, 255, 220, 0.08)"
                  strokeWidth="0.3"
                  strokeDasharray="1 1"
                />
              );
            })}
        </g>

        {/* Ping ripples */}
        {pings.map((ping) => (
          <circle
            key={ping.id}
            cx={ping.x}
            cy={ping.y}
            r="0.5"
            fill="none"
            stroke="#3fffdc"
            strokeWidth="0.3"
            className="ping-ripple"
          />
        ))}

        {/* Agent nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            {/* Glow for online nodes */}
            {node.status === "online" && (
              <circle
                cx={node.x}
                cy={node.y}
                r="2"
                fill="rgba(63, 255, 220, 0.08)"
                className="node-glow"
              />
            )}
            {/* Node dot */}
            <circle
              cx={node.x}
              cy={node.y}
              r={node.status === "online" ? 1 : 0.6}
              fill={
                node.status === "online"
                  ? "#3fffdc"
                  : node.status === "syncing"
                  ? "#f59e0b"
                  : "rgba(255,255,255,0.15)"
              }
              className={`node-dot ${node.status}`}
            />
            {/* Label for online nodes */}
            {node.status === "online" && (
              <text
                x={node.x}
                y={node.y - 2.5}
                textAnchor="middle"
                className="node-label"
              >
                {node.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
