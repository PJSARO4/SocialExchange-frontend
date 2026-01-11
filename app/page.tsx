"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const QUOTE = "Markets are systems. Systems require operators.";

type EventType =
  | "LIGHT_SWEEP"
  | "ORBITAL_SHADOW"
  | "SIGNAL_PULSE"
  | "STAR_COMPRESSION"
  | "DEBRIS_DRIFT"
  | "SYSTEM_PULSE"
  | null;

export default function Entrance() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("SYSTEM STANDBY");
  const [event, setEvent] = useState<EventType>(null);

  /* ===============================
     TYPEWRITER
  ================================ */
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(QUOTE.slice(0, i));
      i++;
      if (i > QUOTE.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  /* ===============================
     EVENT SELECTION (60%)
  ================================ */
  useEffect(() => {
    if (Math.random() > 0.6) return;

    const events: EventType[] = [
      "LIGHT_SWEEP",
      "ORBITAL_SHADOW",
      "SIGNAL_PULSE",
      "STAR_COMPRESSION",
      "DEBRIS_DRIFT",
      "SYSTEM_PULSE",
    ];

    const selected = events[Math.floor(Math.random() * events.length)];
    setEvent(selected);

    if (selected === "SYSTEM_PULSE") {
      setStatus("SYSTEM READY");
      setTimeout(() => setStatus("SYSTEM STANDBY"), 1200);
    }
  }, []);

  /* ===============================
     STARFIELD + EVENT RENDER
  ================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3,
      s: Math.random() * 0.35 + 0.1,
    }));

    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);

      // Base stars
      stars.forEach((s) => {
        s.y += s.s;
        if (s.y > h) s.y = 0;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      /* -------- EVENTS -------- */

      // 1. Light Sweep
      if (event === "LIGHT_SWEEP" && frame < 180) {
        const grd = ctx.createLinearGradient(0, 0, w, h);
        grd.addColorStop(0, "rgba(100,180,255,0)");
        grd.addColorStop(0.5, "rgba(100,180,255,0.05)");
        grd.addColorStop(1, "rgba(100,180,255,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Orbital Shadow
      if (event === "ORBITAL_SHADOW" && frame < 220) {
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(0, 0, w, h);
      }

      // 3. Signal Pulse
      if (event === "SIGNAL_PULSE" && frame % 60 < 2) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(0, Math.random() * h, w, 1);
      }

      // 4. Star Compression
      if (event === "STAR_COMPRESSION" && frame < 160) {
        stars.forEach((s) => {
          s.x += (w / 2 - s.x) * 0.0005;
          s.y += (h / 2 - s.y) * 0.0005;
        });
      }

      // 5. Debris Drift
      if (event === "DEBRIS_DRIFT" && frame < 200) {
        ctx.globalAlpha = 0.08;
        ctx.fillRect(frame % w, frame % h, 2, 2);
      }

      requestAnimationFrame(draw);
    };

    draw();

    window.addEventListener("resize", () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });
  }, [event]);

  /* ===============================
     UI
  ================================ */
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <h1>SOCIAL • EXCHANGE</h1>

        <button
          className="command-button"
          onClick={() => router.push("/cockpit/dashboard")}
        >
          ENTER MISSION CONTROL
        </button>

        <p className="typewriter">{typed}</p>

        <div className="system-online">{status}</div>
      </main>
    </>
  );
}
