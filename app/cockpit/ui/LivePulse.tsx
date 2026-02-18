"use client";

import { useEffect, useState, useRef } from "react";

// ============================================
// Simulated activity events
// ============================================

const ACTIONS = [
  { text: "shares traded", icon: "◆", color: "#3fffdc" },
  { text: "feed synced", icon: "↻", color: "#10b981" },
  { text: "workflow triggered", icon: "⚡", color: "#f59e0b" },
  { text: "listing viewed", icon: "◉", color: "#8b5cf6" },
  { text: "message sent", icon: "▸", color: "#6366f1" },
  { text: "account verified", icon: "✓", color: "#3fffdc" },
  { text: "price alert fired", icon: "△", color: "#f59e0b" },
  { text: "deposit confirmed", icon: "↓", color: "#10b981" },
  { text: "new follower gained", icon: "+", color: "#ec4899" },
  { text: "content scheduled", icon: "◷", color: "#8b5cf6" },
  { text: "escrow released", icon: "◈", color: "#3fffdc" },
  { text: "analytics updated", icon: "≡", color: "#6366f1" },
];

const REGIONS = ["NYC", "LDN", "TKY", "SGP", "LAX", "FRA", "SYD", "DXB", "SAO", "MUM"];

function generateEvent() {
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];
  const count = Math.floor(Math.random() * 40) + 1;
  return {
    id: Date.now() + Math.random(),
    region,
    count,
    ...action,
  };
}

// ============================================
// COMPONENT
// ============================================

export default function LivePulse() {
  const [events, setEvents] = useState(() => [generateEvent(), generateEvent()]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFading(true);

      setTimeout(() => {
        setEvents((prev) => {
          const next = [...prev, generateEvent()];
          if (next.length > 20) next.shift();
          return next;
        });
        setCurrentIdx((prev) => prev + 1);
        setFading(false);
      }, 400);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const event = events[currentIdx % events.length];
  if (!event) return null;

  return (
    <div className="live-pulse">
      <div className="live-pulse-dot" />
      <div className={`live-pulse-content ${fading ? "fading" : ""}`}>
        <span className="live-pulse-icon" style={{ color: event.color }}>
          {event.icon}
        </span>
        <span className="live-pulse-region">{event.region}</span>
        <span className="live-pulse-sep">·</span>
        <span className="live-pulse-text">
          {event.count} {event.text}
        </span>
      </div>
    </div>
  );
}
