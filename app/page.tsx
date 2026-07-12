"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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

/* ===============================
   MARKET TICKER (sample listings)
================================ */
const TICKER = [
  { handle: "@nova.aesthetic", metric: "412K", price: "18,400", dir: "up" },
  { handle: "@deepfield.fm", metric: "88K", price: "3,950", dir: "up" },
  { handle: "@orbit.daily", metric: "1.2M", price: "64,200", dir: "down" },
  { handle: "@synthwave.co", metric: "230K", price: "11,700", dir: "up" },
  { handle: "@quiet.markets", metric: "57K", price: "2,480", dir: "down" },
  { handle: "@apex.reels", metric: "905K", price: "51,300", dir: "up" },
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
  const { data: session, status } = useSession();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 }); // -1..1 parallax offset
  const [typed, setTyped] = useState("");
  const [isExiting, setIsExiting] = useState(false);
  const [exitTarget, setExitTarget] = useState<string | null>(null);
  const [audioStarted, setAudioStarted] = useState(false);
  const [charged, setCharged] = useState(false); // coin spin-up on CTA intent

  const quoteRef = useRef(
    QUOTES[Math.floor(Math.random() * QUOTES.length)]
  );

  const isAuthenticated = status === "authenticated";
  const authChecked = status !== "loading";

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
    setIsExiting(true);
    setExitTarget(path);

    // Wait for exit animation to complete
    setTimeout(() => {
      router.push(path);
    }, 800);
  }, [router, startAudio]);

  // Handle enter button click
  const handleEnter = async () => {
    if (isAuthenticated) {
      navigateWithTransition("/cockpit/home");
    } else {
      navigateWithTransition("/auth/signin");
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
     POINTER PARALLAX
     Writes normalized offset to CSS vars + a ref the canvas reads.
  ================================ */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      pointerRef.current.x = nx;
      pointerRef.current.y = ny;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          const el = pageRef.current;
          if (el) {
            el.style.setProperty("--mx", nx.toFixed(3));
            el.style.setProperty("--my", ny.toFixed(3));
          }
        });
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* ===============================
     STARFIELD (depth layers) + SHOOTING STARS
  ================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Cap the canvas backing resolution so cost can't scale with huge/retina displays.
    // CSS (inset:0) stretches this smaller buffer to fill the viewport.
    const RES_CAP = 1280;
    const capScale = () => Math.min(1, RES_CAP / window.innerWidth);
    let w = (canvas.width = Math.round(window.innerWidth * capScale()));
    let h = (canvas.height = Math.round(window.innerHeight * capScale()));

    // Three depth layers: far (slow, faint, small) -> near (fast, bright, big)
    const LAYERS = [
      { count: 45, depth: 0.15, speed: 0.05, size: 0.9, alpha: 0.4 },
      { count: 34, depth: 0.4, speed: 0.13, size: 1.3, alpha: 0.6 },
      { count: 20, depth: 0.85, speed: 0.26, size: 1.9, alpha: 0.85 },
    ];

    const stars = LAYERS.flatMap((layer) =>
      Array.from({ length: layer.count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * layer.size + 0.3,
        s: Math.random() * layer.speed + layer.speed * 0.4,
        depth: layer.depth,
        alpha: layer.alpha * (Math.random() * 0.5 + 0.5),
      }))
    );

    let shootingStars: ShootingStar[] = [];

    const spawnShootingStar = () => {
      if (shootingStars.length >= 2) return;
      const edge = Math.floor(Math.random() * 4);
      const speed = 14;
      let x = 0, y = 0, vx = 0, vy = 0;
      switch (edge) {
        case 0: x = Math.random() * w; y = -30; vx = speed; vy = speed; break;
        case 1: x = -30; y = Math.random() * h; vx = speed; vy = -speed; break;
        case 2: x = w + 30; y = Math.random() * h; vx = -speed; vy = speed; break;
        case 3: x = Math.random() * w; y = h + 30; vx = -speed; vy = -speed; break;
      }
      shootingStars.push({ x, y, vx, vy, life: 0 });
    };

    spawnShootingStar();
    const spawnInterval = setInterval(spawnShootingStar, 3500);

    let hue = 210;
    let running = true;

    let lastDraw = 0;
    const draw = () => {
      if (!running) return;
      requestAnimationFrame(draw);
      if (document.hidden) return;
      const now = performance.now();
      if (now - lastDraw < 33) return; // throttle canvas to ~30fps (halves cost on large displays)
      lastDraw = now;
      ctx.clearRect(0, 0, w, h);

      /* ---------- STARS (parallax by depth) ---------- */
      const px = pointerRef.current.x;
      const py = pointerRef.current.y;
      stars.forEach((s) => {
        s.y += s.s;
        if (s.y > h) s.y = 0;
        const ox = -px * s.depth * 26;
        const oy = -py * s.depth * 26;
        ctx.globalAlpha = s.alpha;
        // faint cyan tint on the nearest layer
        ctx.fillStyle = s.depth > 0.7 ? "rgba(180,245,255,0.95)" : "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      /* ---------- SHOOTING STARS ---------- */
      ctx.globalAlpha = 1;
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
    };

    // In reduced-motion, paint one static frame and stop.
    if (reduce) {
      const px = 0, py = 0;
      ctx.clearRect(0, 0, w, h);
      stars.forEach((s) => {
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.depth > 0.7 ? "rgba(180,245,255,0.95)" : "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x + px, s.y + py, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      draw();
    }

    const onResize = () => {
      w = canvas.width = Math.round(window.innerWidth * capScale());
      h = canvas.height = Math.round(window.innerHeight * capScale());
    };
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      clearInterval(spawnInterval);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /* ===============================
     UI
  ================================ */
  const chargeOn = () => setCharged(true);
  const chargeOff = () => setCharged(false);

  return (
    <div ref={pageRef} className={`entrance-page ${isExiting ? 'exiting' : ''}`}>
      <canvas ref={canvasRef} className="entrance-canvas" />

      {/* Animated nebula field */}
      <div className="nebula-field" aria-hidden="true">
        <span className="nebula-blob nebula-violet" />
        <span className="nebula-blob nebula-magenta" />
        <span className="nebula-blob nebula-cyan" />
      </div>

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

      <main className={`entrance-main ${charged ? 'charged' : ''}`}>
        {/* ===== E-SHARE EMBLEM (the focal "wow") ===== */}
        <div className="coin-stage" aria-hidden="true">
          <div className="coin-orbit" />
          <div className="eshare-coin">
            <span className="coin-ring" />
            <span className="coin-ring coin-ring-2" />
            <span className="coin-medallion">
              <svg className="coin-mark" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                <g stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 42 L44 20 L76 42 L58 54" />
                  <path d="M88 58 L56 80 L24 58 L42 46" />
                </g>
              </svg>
              <span className="coin-legend">E-SHARE</span>
            </span>
            <span className="coin-glow" />
            <span className="coin-pulse" />
          </div>
        </div>

        <span className="hero-wordmark">SOCIAL&nbsp;•&nbsp;EXCHANGE</span>

        <h1 className="hero-headline">
          {"Trade the feeds that move the world.".split(" ").map((word, i) => (
            <span
              key={i}
              className="hl-word"
              style={{ '--i': i } as React.CSSProperties}
            >
              {word}&nbsp;
            </span>
          ))}
        </h1>

        <p className="hero-sub">
          A secure marketplace for social media assets. Every deal held in escrow.
          Every credit accounted for.
        </p>

        {/* ===== CTA CLUSTER ===== */}
        {isAuthenticated ? (
          <>
            <div className="user-greeting">
              Welcome back, <span className="user-name">{session?.user?.name || session?.user?.email}</span>
            </div>
            <div className="cta-cluster">
              <button
                className="command-button"
                onClick={handleEnter}
                onMouseEnter={chargeOn}
                onMouseLeave={chargeOff}
                onFocus={chargeOn}
                onBlur={chargeOff}
                disabled={isExiting}
              >
                <span className="btn-text">ENTER MISSION CONTROL</span>
                <span className="btn-glow" />
              </button>
            </div>
            <div className="auth-links">
              <span onClick={() => navigateWithTransition("/auth/signin")} className="auth-link">Switch Account</span>
            </div>
          </>
        ) : (
          <>
            <div className="cta-cluster">
              <button
                className="command-button"
                onClick={handleEnter}
                onMouseEnter={chargeOn}
                onMouseLeave={chargeOff}
                onFocus={chargeOn}
                onBlur={chargeOff}
                disabled={isExiting}
              >
                <span className="btn-text">{authChecked ? "ENTER THE EXCHANGE" : "INITIALIZING..."}</span>
                <span className="btn-glow" />
              </button>
              <button
                className="ghost-button"
                onClick={() => navigateWithTransition("/cockpit/trading-post")}
                disabled={isExiting}
              >
                Explore the Market <span className="ghost-arrow">→</span>
              </button>
            </div>
            <div className="auth-links">
              <span onClick={() => navigateWithTransition("/auth/signin")} className="auth-link">Sign In</span>
              <span className="auth-separator">•</span>
              <span onClick={() => navigateWithTransition("/auth/signup")} className="auth-link">Create Account</span>
            </div>
          </>
        )}

        {/* ===== TRUST CHIPS ===== */}
        <div className="trust-chips">
          <span className="trust-chip"><span className="chip-ico">🛡</span> Escrow-protected</span>
          <span className="trust-chip"><span className="chip-ico chip-gold">◈</span> Priced in E-Shares</span>
          <span className="trust-chip"><span className="chip-dot" /> System online</span>
        </div>
      </main>

      {/* ===== MARKET TICKER HUD ===== */}
      <div className="market-ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span className="ticker-item" key={i}>
              <span className="ticker-handle">{t.handle}</span>
              <span className="ticker-metric">{t.metric}</span>
              <span className={`ticker-price ${t.dir}`}>
                ◈ {t.price} <span className="ticker-arrow">{t.dir === "up" ? "▲" : "▼"}</span>
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="entrance-footer">
        <div className="footer-line" />
        <span className="footer-text">DIGITAL ASSET COMMAND CENTER</span>
        <div className="footer-line" />
      </div>

    </div>
  );
}
