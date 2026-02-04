'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './welcome-experience.css';

// ============================================
// QUOTE BANK - Tactical/Professional Themes
// ============================================
const WELCOME_QUOTES = [
  "Command center online. All systems nominal.",
  "Your digital empire awaits management.",
  "Operators don't react. They anticipate.",
  "Every feed is an asset. Every asset has value.",
  "Data flows. Markets respond. Leaders adapt.",
  "Social presence is infrastructure.",
  "The network never sleeps. Neither does opportunity.",
  "Engagement is currency. Spend it wisely.",
];

// ============================================
// STATS THAT ANIMATE IN
// ============================================
const SYSTEM_STATS = [
  { label: 'FEEDS ONLINE', value: '4', icon: '📡' },
  { label: 'SCHEDULED', value: '12', icon: '📅' },
  { label: 'ENGAGEMENT', value: '+8.4%', icon: '📈' },
  { label: 'CREDITS', value: '8,450', icon: '💎' },
];

// ============================================
// NAVIGATION DESTINATIONS
// ============================================
const QUICK_DESTINATIONS = [
  { id: 'feeds', label: 'E-Feeds', path: '/cockpit/my-e-assets/my-feeds', icon: '📡', desc: 'Manage & automate' },
  { id: 'shares', label: 'E-Shares', path: '/cockpit/my-e-assets/my-e-shares', icon: '💎', desc: 'Community credits' },
  { id: 'market', label: 'Market', path: '/cockpit/my-e-assets/market', icon: '🏪', desc: 'Buy & sell assets' },
  { id: 'dashboard', label: 'Dashboard', path: '/cockpit/dashboard', icon: '⚡', desc: 'Command center' },
];

interface WelcomeExperienceProps {
  userName?: string;
  onComplete?: () => void;
  skipAnimation?: boolean;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export default function WelcomeExperience({
  userName = 'Operator',
  onComplete,
  skipAnimation = false
}: WelcomeExperienceProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Animation states
  const [phase, setPhase] = useState<'intro' | 'reveal' | 'ready' | 'exit'>('intro');
  const [typed, setTyped] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [showDestinations, setShowDestinations] = useState(false);
  const [activeDestination, setActiveDestination] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // Quote reference
  const quoteRef = useRef(
    WELCOME_QUOTES[Math.floor(Math.random() * WELCOME_QUOTES.length)]
  );

  // ============================================
  // CINEMATIC CANVAS - Starfield with depth
  // ============================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Create star layers for depth effect
    const stars: Star[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.7 + 0.3,
    }));

    // Shooting stars array
    const shootingStars: ShootingStar[] = [];

    // Spawn shooting star
    const spawnShootingStar = () => {
      if (shootingStars.length >= 3) return;

      const side = Math.floor(Math.random() * 2); // 0 = top, 1 = left
      let x, y, vx, vy;

      if (side === 0) {
        x = Math.random() * width;
        y = -20;
        vx = (Math.random() - 0.3) * 8;
        vy = Math.random() * 6 + 8;
      } else {
        x = -20;
        y = Math.random() * height * 0.5;
        vx = Math.random() * 8 + 6;
        vy = (Math.random() - 0.3) * 4;
      }

      shootingStars.push({ x, y, vx, vy, life: 0, maxLife: 60 + Math.random() * 40 });
    };

    // Spawn interval
    const spawnInterval = setInterval(spawnShootingStar, 2500);
    spawnShootingStar(); // Initial spawn

    // Ambient hue
    let hue = 210;
    let centerGlow = 0;
    const targetGlow = phase === 'ready' ? 0.15 : 0.08;

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const bgGrad = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.8
      );
      bgGrad.addColorStop(0, 'rgba(10, 20, 40, 1)');
      bgGrad.addColorStop(0.5, 'rgba(5, 10, 25, 1)');
      bgGrad.addColorStop(1, 'rgba(2, 4, 10, 1)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient color pulse
      hue = (hue + 0.02) % 360;
      const ambient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.6
      );
      ambient.addColorStop(0, `hsla(${hue}, 60%, 40%, 0.06)`);
      ambient.addColorStop(1, 'transparent');
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, width, height);

      // Center glow (builds up as page loads)
      centerGlow += (targetGlow - centerGlow) * 0.02;
      const coreGlow = ctx.createRadialGradient(
        width / 2, height * 0.4, 0,
        width / 2, height * 0.4, width * 0.4
      );
      coreGlow.addColorStop(0, `rgba(63, 255, 220, ${centerGlow})`);
      coreGlow.addColorStop(0.5, `rgba(63, 255, 220, ${centerGlow * 0.3})`);
      coreGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw and update stars
      stars.forEach(star => {
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }

        // Twinkle effect
        const twinkle = 0.5 + Math.sin(Date.now() * 0.002 + star.x) * 0.5;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();
      });

      // Draw shooting stars
      shootingStars.forEach((ss, index) => {
        if (ss.life < ss.maxLife) {
          const progress = ss.life / ss.maxLife;
          const alpha = progress < 0.2 ? progress * 5 : (1 - progress) * 1.25;

          // Trail
          const trailLength = 30;
          const gradient = ctx.createLinearGradient(
            ss.x - ss.vx * 3, ss.y - ss.vy * 3,
            ss.x, ss.y
          );
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(1, `rgba(200, 255, 255, ${alpha})`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ss.x - ss.vx * 3, ss.y - ss.vy * 3);
          ctx.lineTo(ss.x, ss.y);
          ctx.stroke();

          // Head
          ctx.beginPath();
          ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();

          ss.x += ss.vx;
          ss.y += ss.vy;
          ss.life++;
        }
      });

      // Clean up dead shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        if (shootingStars[i].life >= shootingStars[i].maxLife) {
          shootingStars.splice(i, 1);
        }
      }

      // Vignette
      const vignette = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.3,
        width / 2, height / 2, width * 0.8
      );
      vignette.addColorStop(0, 'transparent');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(spawnInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [phase]);

  // ============================================
  // TYPEWRITER EFFECT
  // ============================================
  useEffect(() => {
    if (skipAnimation) {
      setTyped(quoteRef.current);
      setPhase('ready');
      setShowStats(true);
      setShowDestinations(true);
      return;
    }

    let i = 0;
    const text = quoteRef.current;

    // Delay before typing starts
    const startDelay = setTimeout(() => {
      setPhase('reveal');

      const interval = setInterval(() => {
        setTyped(text.slice(0, i));
        i++;
        if (i > text.length) {
          clearInterval(interval);

          // After typing, show stats
          setTimeout(() => setShowStats(true), 400);
          setTimeout(() => setShowDestinations(true), 800);
          setTimeout(() => setPhase('ready'), 1200);
        }
      }, 45);

      return () => clearInterval(interval);
    }, 800);

    return () => clearTimeout(startDelay);
  }, [skipAnimation]);

  // ============================================
  // NAVIGATION HANDLER
  // ============================================
  const handleNavigate = useCallback((path: string) => {
    setIsExiting(true);
    setPhase('exit');

    setTimeout(() => {
      if (onComplete) onComplete();
      router.push(path);
    }, 600);
  }, [router, onComplete]);

  // ============================================
  // GET TIME-BASED GREETING
  // ============================================
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className={`welcome-experience ${phase} ${isExiting ? 'exiting' : ''}`}>
      {/* Cinematic Canvas Background */}
      <canvas
        ref={canvasRef}
        className="welcome-canvas"
      />

      {/* Scan Lines Overlay */}
      <div className="welcome-scanlines" />

      {/* Grid Pattern */}
      <div className="welcome-grid" />

      {/* Main Content Container */}
      <div className="welcome-content">
        {/* Logo Section */}
        <div className="welcome-logo-section">
          <div className="welcome-logo-glow" />
          <h1 className="welcome-logo">
            <span className="logo-social">SOCIAL</span>
            <span className="logo-dot">·</span>
            <span className="logo-exchange">EXCHANGE</span>
          </h1>
          <div className="welcome-tagline">DIGITAL ASSET COMMAND CENTER</div>
        </div>

        {/* Greeting */}
        <div className="welcome-greeting">
          <span className="greeting-text">{getGreeting()},</span>
          <span className="greeting-name">{userName}</span>
        </div>

        {/* Typewriter Quote */}
        <p className="welcome-quote">
          {typed}
          <span className="quote-cursor">|</span>
        </p>

        {/* System Stats */}
        <div className={`welcome-stats ${showStats ? 'visible' : ''}`}>
          {SYSTEM_STATS.map((stat, index) => (
            <div
              key={stat.label}
              className="stat-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="stat-icon">{stat.icon}</span>
              <div className="stat-info">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Destinations */}
        <div className={`welcome-destinations ${showDestinations ? 'visible' : ''}`}>
          <div className="destinations-label">SELECT DESTINATION</div>
          <div className="destinations-grid">
            {QUICK_DESTINATIONS.map((dest, index) => (
              <button
                key={dest.id}
                className={`destination-card ${activeDestination === dest.id ? 'active' : ''}`}
                style={{ animationDelay: `${index * 80}ms` }}
                onMouseEnter={() => setActiveDestination(dest.id)}
                onMouseLeave={() => setActiveDestination(null)}
                onClick={() => handleNavigate(dest.path)}
              >
                <span className="dest-icon">{dest.icon}</span>
                <div className="dest-content">
                  <span className="dest-label">{dest.label}</span>
                  <span className="dest-desc">{dest.desc}</span>
                </div>
                <span className="dest-arrow">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Skip / Enter Button */}
        <button
          className={`welcome-enter-btn ${phase === 'ready' ? 'visible' : ''}`}
          onClick={() => handleNavigate('/cockpit/dashboard')}
        >
          <span className="btn-text">ENTER COMMAND CENTER</span>
          <span className="btn-glow" />
        </button>
      </div>

      {/* Bottom HUD */}
      <div className="welcome-hud-bottom">
        <div className="hud-item">
          <span className="hud-dot online" />
          <span className="hud-label">SYSTEMS ONLINE</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">
            {new Date().toLocaleDateString([], {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
        <div className="hud-item">
          <span className="hud-label">
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {/* Side Decorative Elements */}
      <div className="welcome-side-accent left">
        <div className="accent-line" />
        <div className="accent-dot" />
        <div className="accent-line" />
      </div>
      <div className="welcome-side-accent right">
        <div className="accent-line" />
        <div className="accent-dot" />
        <div className="accent-line" />
      </div>
    </div>
  );
}
