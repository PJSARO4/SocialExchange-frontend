"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, isAuthenticated, seedAuthIfEmpty, repairAuthIfNeeded } from "@/app/lib/auth/auth-store";
import { getAmbientAudio } from "@/lib/audio/AmbientAudioEngine";
import "./entrance.css";

/* ===============================
   QUOTE BANK
================================ */
const QUOTES = [
  "Markets are systems. Systems require operators.",
  "Liquidity is movement. Movement creates value.",
  "Control is not speed. Control is awareness.",
  "Every signal has a cost.",
  "Infrastructure outlives speculation.",
  "Silence is a form of information.",
  "Not all assets are visible.",
  "Stability is engineered, not assumed.",
];

type ShootingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
};

export default function Entrance() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [typed, setTyped] = useState("");
  const [user, setUser] = useState<ReturnType<typeof getCurrentUser>>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitTarget, setExitTarget] = useState<string | null>(null);
  const [audioStarted, setAudioStarted] = useState(false);

  const quoteRef = useRef(
    QUOTES[Math.floor(Math.random() * QUOTES.length)]
  );

  // Check authentication on mount
  useEffect(() => {
    seedAuthIfEmpty();
    repairAuthIfNeeded(); // Ensure auth data is valid
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setAuthChecked(true);
  }, []);

  // Start ambient audio on user interaction
  const startAudio = useCallback(async () => {
    if (audioStarted) return;

    try {
      const audio = getAmbientAudio();
      await audio.start('entrance');
      setAudioStarted(true);
    } catch (error) {
      console.warn('Could not start ambient audio:', error);
    }
  }, [audioStarted]);

  // Handle navigation with exit animation
  const navigateWithTransition = useCallback((path: string) => {
    // Start audio if not already started (user clicked something)
    startAudio();

    // Play transition sound
    try {
      const audio = getAmbientAudio();
      audio.playTransitionSound();
    } catch (e) {
      // Ignore audio errors
    }

    setIsExiting(true);
    setExitTarget(path);

    // Wait for exit animation to complete
    setTimeout(() => {
      router.push(path);
    }, 800);
  }, [router, startAudio]);

  // Handle enter button click
  const handleEnter = async () => {
    // Start audio on click (required by browser autoplay policies)
    await startAudio();

    if (isAuthenticated()) {
      navigateWithTransition("/cockpit/dashboard");
    } else {
      navigateWithTransition("/auth/login");
    }
  };

  /* ===============================
     TYPEWRITER
  ================================ */
  useEffect(() => {
    let i = 0;
    const text = quoteRef.current;
    const interval = setInterval(() => {
      setTyped(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  /* ===============================
     STARFIELD + CONTINUOUS SHOOTING STARS
  ================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.4,
      s: Math.random() * 0.25 + 0.1,
    }));

    let shootingStars: ShootingStar[] = [];

    const spawnShootingStar = () => {
      if (shootingStars.length >= 2) return;

      const edge = Math.floor(Math.random() * 4);
      const speed = 14;

      let x = 0,
        y = 0,
        vx = 0,
        vy = 0;

      switch (edge) {
        case 0: // top
          x = Math.random() * w;
          y = -30;
          vx = speed;
          vy = speed;
          break;
        case 1: // left
          x = -30;
          y = Math.random() * h;
          vx = speed;
          vy = -speed;
          break;
        case 2: // right
          x = w + 30;
          y = Math.random() * h;
          vx = -speed;
          vy = speed;
          break;
        case 3: // bottom
          x = Math.random() * w;
          y = h + 30;
          vx = -speed;
          vy = -speed;
          break;
      }

      shootingStars.push({ x, y, vx, vy, life: 0 });
    };

    // spawn immediately, then continuously
    spawnShootingStar();
    const spawnInterval = setInterval(spawnShootingStar, 3500);

    let hue = 210;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      /* ---------- AMBIENT COLOR FIELD ---------- */
      hue = (hue + 0.015) % 360;
      const ambient = ctx.createRadialGradient(
        w / 2,
        h / 2,
        0,
        w / 2,
        h / 2,
        w
      );
      ambient.addColorStop(
        0,
        `hsla(${hue}, 60%, 45%, 0.04)`
      );
      ambient.addColorStop(
        1,
        `hsla(${(hue + 50) % 360}, 60%, 20%, 0)`
      );
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, w, h);

      /* ---------- STARS ---------- */
      ctx.fillStyle = "#ffffff";
      stars.forEach((s) => {
        s.y += s.s;
        if (s.y > h) s.y = 0;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      /* ---------- SHOOTING STARS ---------- */
      shootingStars.forEach((s) => {
        if (s.life < 70) {
          ctx.strokeStyle = "rgba(255,255,255,0.9)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          s.x += s.vx;
          s.y += s.vy;
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
          s.life++;
        }
      });

      shootingStars = shootingStars.filter((s) => s.life < 70);

      requestAnimationFrame(draw);
    };

    draw();

    window.addEventListener("resize", () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    return () => clearInterval(spawnInterval);
  }, []);

  /* ===============================
     UI
  ================================ */
  return (
    <div className={`entrance-page ${isExiting ? 'exiting' : ''}`}>
      <canvas
        ref={canvasRef}
        className="entrance-canvas"
      />

      {/* Exit transition overlay */}
      <div className={`entrance-exit-overlay ${isExiting ? 'active' : ''}`}>
        <div className="exit-warp-lines">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="warp-line" style={{ '--index': i } as React.CSSProperties} />
          ))}
        </div>
        <div className="exit-center-glow" />
        <div className="exit-text">
          {exitTarget?.includes('cockpit') ? 'ENTERING COCKPIT' : 'AUTHENTICATING'}
        </div>
      </div>

      <main className="entrance-main">
        <h1 className="entrance-title">SOCIAL • EXCHANGE</h1>

        {user ? (
          <>
            <div className="user-greeting">
              Welcome back, <span className="user-name">{user.displayName}</span>
            </div>
            <button
              className="command-button"
              onClick={handleEnter}
              disabled={isExiting}
            >
              <span className="btn-text">ENTER MISSION CONTROL</span>
              <span className="btn-glow" />
            </button>
          </>
        ) : (
          <>
            <button
              className="command-button"
              onClick={handleEnter}
              disabled={isExiting}
            >
              <span className="btn-text">{authChecked ? "AUTHENTICATE" : "INITIALIZING..."}</span>
              <span className="btn-glow" />
            </button>
            <div className="auth-links">
              <span onClick={() => navigateWithTransition("/auth/login")} className="auth-link">Sign In</span>
              <span className="auth-separator">•</span>
              <span onClick={() => navigateWithTransition("/auth/signup")} className="auth-link">Create Account</span>
            </div>
          </>
        )}

        <p className="typewriter">{typed}<span className="cursor">|</span></p>

        <div className="system-online">
          {user ? `OPERATOR: ${user.username.toUpperCase()}` : "SYSTEM STANDBY"}
        </div>
      </main>

      {/* Bottom decoration */}
      <div className="entrance-footer">
        <div className="footer-line" />
        <span className="footer-text">DIGITAL ASSET COMMAND CENTER</span>
        <div className="footer-line" />
      </div>

      {/* Audio hint - only show if audio not started */}
      {!audioStarted && (
        <div className="audio-hint" onClick={startAudio}>
          <span className="audio-hint-icon">🔊</span>
          <span className="audio-hint-text">Click for ambient audio</span>
        </div>
      )}
    </div>
  );
}
