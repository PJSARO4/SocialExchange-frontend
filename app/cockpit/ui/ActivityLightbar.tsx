"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

// ============================================
// ACTIVITY MODES — each has its own color palette + behavior
// ============================================

type ActivityMode =
  | "idle"       // Default — slow ambient drift
  | "navigating" // Just changed pages — brief burst
  | "feeds"      // Working in My Feeds — productive green/cyan pulses
  | "trading"    // E-Shares / Market — amber/gold energy
  | "comms"      // Communications — blue/purple waves
  | "building"   // Founder Panel / Trading Post — intense multi-color
  | "dashboard"; // Dashboard — calm monitoring mode

interface ModeConfig {
  colors: string[];
  speed: number;      // animation speed multiplier (1 = normal)
  intensity: number;  // glow intensity 0-1
  segments: number;   // how many light segments are active
  pattern: "wave" | "pulse" | "cascade" | "storm" | "breathe";
}

const MODE_CONFIGS: Record<ActivityMode, ModeConfig> = {
  idle: {
    colors: ["rgba(63,255,220,0.15)", "rgba(63,255,220,0.05)", "rgba(100,120,255,0.08)"],
    speed: 0.3,
    intensity: 0.2,
    segments: 3,
    pattern: "breathe",
  },
  navigating: {
    colors: ["rgba(63,255,220,0.8)", "rgba(0,180,255,0.6)", "rgba(63,255,220,0.4)"],
    speed: 3,
    intensity: 0.9,
    segments: 8,
    pattern: "cascade",
  },
  feeds: {
    colors: ["rgba(0,255,136,0.5)", "rgba(63,255,220,0.4)", "rgba(16,185,129,0.3)", "rgba(52,211,153,0.35)"],
    speed: 1.2,
    intensity: 0.6,
    segments: 6,
    pattern: "pulse",
  },
  trading: {
    colors: ["rgba(245,158,11,0.5)", "rgba(251,191,36,0.4)", "rgba(255,136,0,0.35)", "rgba(63,255,220,0.2)"],
    speed: 1.5,
    intensity: 0.65,
    segments: 7,
    pattern: "wave",
  },
  comms: {
    colors: ["rgba(99,102,241,0.5)", "rgba(139,92,246,0.4)", "rgba(63,255,220,0.2)", "rgba(167,139,250,0.3)"],
    speed: 0.8,
    intensity: 0.5,
    segments: 5,
    pattern: "wave",
  },
  building: {
    colors: ["rgba(63,255,220,0.6)", "rgba(245,158,11,0.5)", "rgba(139,92,246,0.4)", "rgba(236,72,153,0.3)", "rgba(0,255,136,0.4)"],
    speed: 2,
    intensity: 0.8,
    segments: 10,
    pattern: "storm",
  },
  dashboard: {
    colors: ["rgba(63,255,220,0.25)", "rgba(100,120,255,0.15)", "rgba(63,255,220,0.1)"],
    speed: 0.5,
    intensity: 0.3,
    segments: 4,
    pattern: "breathe",
  },
};

// Map pathnames to activity modes
function getActivityMode(pathname: string): ActivityMode {
  if (pathname.includes("/my-feeds")) return "feeds";
  if (pathname.includes("/my-e-shares") || pathname.includes("/market")) return "trading";
  if (pathname.includes("/comms")) return "comms";
  if (pathname.includes("/founder") || pathname.includes("/trading-post")) return "building";
  if (pathname.includes("/dashboard")) return "dashboard";
  return "idle";
}

// Total number of light segments across the bar
const TOTAL_SEGMENTS = 24;

// ============================================
// COMPONENT
// ============================================

export default function ActivityLightbar() {
  const pathname = usePathname();
  const [mode, setMode] = useState<ActivityMode>("idle");
  const [segments, setSegments] = useState<number[]>(new Array(TOTAL_SEGMENTS).fill(0));
  const [interactionBoost, setInteractionBoost] = useState(0);
  const animFrame = useRef<number>(0);
  const timeRef = useRef(0);
  const lastPathRef = useRef(pathname);
  const boostDecayRef = useRef<NodeJS.Timeout | null>(null);

  // Detect page changes → brief "navigating" burst
  useEffect(() => {
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname;
      setMode("navigating");
      // After burst, settle into the page's mode
      const timer = setTimeout(() => {
        setMode(getActivityMode(pathname));
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setMode(getActivityMode(pathname));
    }
  }, [pathname]);

  // Detect user interactions → boost intensity
  const handleInteraction = useCallback(() => {
    setInteractionBoost(1);
    if (boostDecayRef.current) clearTimeout(boostDecayRef.current);
    boostDecayRef.current = setTimeout(() => {
      setInteractionBoost(0.5);
      boostDecayRef.current = setTimeout(() => {
        setInteractionBoost(0);
      }, 3000);
    }, 2000);
  }, []);

  useEffect(() => {
    const events = ["click", "keydown", "scroll"];
    events.forEach((e) => window.addEventListener(e, handleInteraction, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, handleInteraction));
      if (boostDecayRef.current) clearTimeout(boostDecayRef.current);
    };
  }, [handleInteraction]);

  // Animation loop
  useEffect(() => {
    const config = MODE_CONFIGS[mode];
    let running = true;

    const animate = () => {
      if (!running) return;
      timeRef.current += 0.016 * config.speed;
      const t = timeRef.current;
      const boost = interactionBoost;

      const newSegments = new Array(TOTAL_SEGMENTS).fill(0).map((_, i) => {
        const pos = i / TOTAL_SEGMENTS;
        let value = 0;

        switch (config.pattern) {
          case "breathe":
            value = (Math.sin(t * 0.5 + pos * Math.PI * 2) * 0.5 + 0.5) * config.intensity;
            break;

          case "wave":
            value =
              (Math.sin(t * 2 + pos * Math.PI * 4) * 0.5 + 0.5) *
              config.intensity *
              (0.5 + Math.sin(t * 0.3 + pos * Math.PI) * 0.5);
            break;

          case "pulse": {
            const pulseCenter = (Math.sin(t * 0.8) * 0.5 + 0.5);
            const dist = Math.abs(pos - pulseCenter);
            value = Math.max(0, 1 - dist * 4) * config.intensity;
            // Add secondary pulse
            const pulse2 = (Math.sin(t * 1.2 + Math.PI) * 0.5 + 0.5);
            const dist2 = Math.abs(pos - pulse2);
            value = Math.max(value, Math.max(0, 1 - dist2 * 5) * config.intensity * 0.7);
            break;
          }

          case "cascade": {
            const cascadePos = (t * 2) % 1;
            const dist = pos - cascadePos;
            const wrap = dist < -0.5 ? dist + 1 : dist > 0.5 ? dist - 1 : dist;
            value = Math.max(0, 1 - Math.abs(wrap) * 6) * config.intensity;
            break;
          }

          case "storm": {
            value =
              (Math.sin(t * 3 + pos * 10) * 0.3 +
                Math.sin(t * 1.7 + pos * 6) * 0.3 +
                Math.sin(t * 5 + pos * 15) * 0.2 +
                0.2) *
              config.intensity;
            // Random sparkle
            if (Math.random() < 0.02) value = config.intensity;
            break;
          }
        }

        // Apply interaction boost
        if (boost > 0) {
          value = Math.min(1, value + boost * 0.3 * (Math.sin(t * 4 + i * 0.5) * 0.5 + 0.5));
        }

        return Math.max(0, Math.min(1, value));
      });

      setSegments(newSegments);
      animFrame.current = requestAnimationFrame(animate);
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      cancelAnimationFrame(animFrame.current);
    };
  }, [mode, interactionBoost]);

  const config = MODE_CONFIGS[mode];

  return (
    <div className="activity-lightbar">
      <div className="lightbar-strip">
        {segments.map((value, i) => {
          const colorIdx = i % config.colors.length;
          const baseColor = config.colors[colorIdx];
          // Parse rgba and adjust alpha by segment value
          const adjustedColor = baseColor.replace(
            /[\d.]+\)$/,
            `${(parseFloat(baseColor.match(/[\d.]+\)$/)?.[0] || "0.5") * value).toFixed(3)})`
          );

          return (
            <div
              key={i}
              className="lightbar-segment"
              style={{
                background: adjustedColor,
                opacity: 0.3 + value * 0.7,
                boxShadow: value > 0.5
                  ? `0 0 ${Math.round(value * 12)}px ${adjustedColor}, 0 0 ${Math.round(value * 4)}px ${adjustedColor}`
                  : "none",
              }}
            />
          );
        })}
      </div>
      {/* Reflection line */}
      <div className="lightbar-reflection" />
    </div>
  );
}
