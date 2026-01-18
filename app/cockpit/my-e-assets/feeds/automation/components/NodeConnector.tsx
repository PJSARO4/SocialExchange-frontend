'use client';

export default function NodeConnector() {
  return (
    <div className="node-connector">
      <svg className="node-connector-svg" width="100%" height="40">
        <line
          x1="50%"
          y1="0"
          x2="50%"
          y2="40"
          stroke="rgba(63, 255, 220, 0.3)"
          strokeWidth="2"
        />
        <polygon
          points="50%,35 45%,28 55%,28"
          fill="rgba(63, 255, 220, 0.5)"
          transform="translate(-50%, 0)"
          style={{ transformOrigin: '50% 0' }}
        />
      </svg>
    </div>
  );
}