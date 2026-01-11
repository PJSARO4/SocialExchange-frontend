"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const QUOTE = "Markets are systems. Systems require operators.";

export default function Entrance() {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("SYSTEM INITIALIZING");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* ---------- TYPEWRITER ---------- */
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTyped(QUOTE.slice(0, i));
      i++;
      if (i > QUOTE.length) {
        clearInterval(interval);
        setTimeout(() => setStatus("SYSTEM STANDBY"), 600);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  /* ---------- STARFIELD ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2,
      s: Math.random() * 0.3 + 0.1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#ffffff";

      stars.forEach((star) => {
        star.y += star.s;
        if (star.y > h) star.y = 0;
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener("resize", () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });
  }, []);

  return (
    <>
      {/* Space Layer */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* UI Layer */}
      <main
        style={{
          position: "relative",
          zIndex: 1,
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          textAlign: "center",
        }}
      >
        <h1 style={{ letterSpacing: "0.5em", marginBottom: "1.5rem" }}>
          SOCIAL • EXCHANGE
        </h1>

        {/* BUTTON IS PRESENT IMMEDIATELY */}
        <button
          className="command-button"
          onClick={() => router.push("/cockpit/dashboard")}
        >
          ENTER MISSION CONTROL
        </button>

        {/* TYPEWRITER */}
        <p
          className="typewriter"
          style={{
            marginTop: "1.5rem",
            color: "var(--text-muted)",
          }}
        >
          {typed}
        </p>

        {/* STATUS */}
        <div className="system-online">{status}</div>
      </main>
    </>
  );
}
