'use client';

import Link from 'next/link';
import { ReactNode, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import './cockpit.css';


import ActivityLightbar from './ui/ActivityLightbar';
import PresencePing from './ui/PresencePing';
import LivePulse from './ui/LivePulse';
import LogsPanel from './ui/LogsPanel';
import SignalPanel from './ui/SignalPanel';
import GlobalCopilot from './ui/GlobalCopilot';
import WelcomeExperience from '@/components/welcome/WelcomeExperience';
import { PageTransitionProvider } from '@/components/transitions/PageTransition';
import { AmbientAudioProvider, useAmbientAudio } from '@/lib/audio/useAmbientAudio';
import AudioControl from '@/components/audio/AudioControl';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Brain, Home, Layers, TrendingUp, FlaskConical, MessageSquare, SlidersHorizontal, Shield } from 'lucide-react';
import MoodBackground from '@/components/audio/MoodBackground';
import GlobalChatWidget from './comms/components/GlobalChatWidget';
import { ToastProvider } from './ui/toast/ToastProvider';
import { ThemeProvider } from '@/app/context/ThemeContext';

// CORRECT PATH (file lives in app/cockpit/context)
import { AccountProvider } from './context/AccountContext';

// Mobile menu hook
const useMobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, toggle, close };
};


// Check if this is a fresh session (should show welcome)
const shouldShowWelcome = () => {
  if (typeof window === 'undefined') return false;
  const sessionKey = 'se-cockpit-entered';
  const hasEntered = sessionStorage.getItem(sessionKey);
  return !hasEntered;
};

// Mark that the user has entered the cockpit
const markCockpitEntered = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('se-cockpit-entered', 'true');
};

// Wallet balance badge for the topbar
function WalletBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch('/api/wallet/balance');
        if (!res.ok) { setBalance(null); return; }
        const data = await res.json();
        setBalance(data.wallet?.balance ?? null);
      } catch {
        setBalance(null);
      }
    }

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  if (balance === null) return null;

  const formatted = balance.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Link
      href="/cockpit/my-e-assets/my-e-shares"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        textDecoration: 'none',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        letterSpacing: '0.08em',
        color: 'var(--green-signal)',
        padding: '4px 10px',
        borderRadius: '6px',
        border: '1px solid rgba(0, 255, 136, 0.15)',
        background: 'rgba(0, 255, 136, 0.04)',
        transition: 'all 200ms ease',
        marginRight: '12px',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{formatted}</span>
    </Link>
  );
}

// Inner component that uses audio context
function CockpitContent({ children, userName }: { children: ReactNode; userName: string }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { setMoodForPath } = useAmbientAudio();
  const { isOpen: mobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu } = useMobileMenu();

  const [logsOpen, setLogsOpen] = useState(false);
  const [signalOpen, setSignalOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [globalChatOpen, setGlobalChatOpen] = useState(false);

  // Update audio mood based on path
  useEffect(() => {
    if (!pathname) return;
    // Map cockpit paths to audio moods
    if (pathname.includes('dashboard')) {
      setMoodForPath('dashboard');
    } else if (pathname.includes('market') || pathname.includes('trading')) {
      setMoodForPath('market');
    } else if (pathname.includes('feeds') || pathname.includes('my-feeds')) {
      setMoodForPath('feeds');
    } else if (pathname.includes('comms')) {
      setMoodForPath('comms');
    } else {
      setMoodForPath('command');
    }
  }, [pathname, setMoodForPath]);

  return (
    <div className="cockpit-root" data-section={(pathname || '').split('/')[2] || 'home'}>
      {/* SILENT PRESENCE BEACON (admin live map) */}
      <PresencePing />

      {/* CONSTANT EARTH-FROM-ORBIT BACKDROP (pure CSS, perf-safe) */}
      <div className="earth-backdrop" aria-hidden="true">
        <div className="eb-stars" />
        <div className="eb-earth" />
        <div className="eb-atmo" />
      </div>

      {/* MOOD-REACTIVE BACKGROUND */}
      <MoodBackground />

      {/* MOBILE MENU TOGGLE */}
      <button
        className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={mobileMenuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* MOBILE OVERLAY */}
      <div
        className={`mobile-sidebar-overlay ${mobileMenuOpen ? 'visible' : ''}`}
        onClick={closeMobileMenu}
      />

      {/* TOP BAR */}
      <header className="cockpit-topbar">
        <ActivityLightbar />
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
            <defs>
              <radialGradient id="brandPlanet" cx="38%" cy="34%" r="70%">
                <stop offset="0%" stopColor="#7de3ff" />
                <stop offset="55%" stopColor="#2b8fd6" />
                <stop offset="100%" stopColor="#123a63" />
              </radialGradient>
            </defs>
            <ellipse cx="20" cy="20" rx="18.5" ry="6.4" fill="none" stroke="#38bdf8" strokeWidth="1.4" opacity="0.85" transform="rotate(-22 20 20)" />
            <circle cx="20" cy="20" r="9.5" fill="url(#brandPlanet)" />
            <ellipse cx="16.5" cy="16.5" rx="3" ry="2" fill="rgba(255,255,255,0.35)" />
          </svg>
          <div className="brand-text">
            <span className="brand-word">SOCIAL · EXCHANGE</span>
            <span className="brand-tag">ACQUIRE · GROW · DOMINATE</span>
          </div>
        </div>
        <div className="topbar-center">
          <LivePulse />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <WalletBadge />
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.25rem 0.65rem', borderRadius: '999px',
            background: 'rgba(0,255,200,0.07)', border: '1px solid rgba(0,255,200,0.2)',
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
            color: '#3fffdc', textTransform: 'uppercase',
          }}>
            <span style={{ opacity: 0.5 }}>▸</span> {userName}
          </div>
          <div className="exit-cockpit">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit', padding: 0 }}
            >
              Exit Cockpit
            </button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="cockpit-body">
        <aside className={`cockpit-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-title">NAVIGATION</div>

          {[
            { href: '/cockpit/home', label: 'Cockpit', sub: 'Mission Control', Icon: Home, match: (p: string) => p === '/cockpit/home' },
            { href: '/cockpit/my-e-assets', label: 'My E-Assets', sub: 'Your Fleet', Icon: Layers, match: (p: string) => p === '/cockpit/my-e-assets' || p.startsWith('/cockpit/my-e-assets/') },
            { href: '/cockpit/trading-post', label: 'The Exchange Floor', sub: 'Trade & Discover', Icon: TrendingUp, match: (p: string) => p === '/cockpit/trading-post' || p.startsWith('/cockpit/trading-post/') },
            { href: '/cockpit/meme-lab', label: 'Content Lab', sub: 'Create & Deploy', Icon: FlaskConical, match: (p: string) => p === '/cockpit/meme-lab' },
            { href: '/cockpit/comms', label: 'Comms', sub: 'Messages & Deals', Icon: MessageSquare, match: (p: string) => p === '/cockpit/comms' },
            { href: '/cockpit/dashboard', label: 'Command Center', sub: 'Settings & Integrations', Icon: SlidersHorizontal, match: (p: string) => p === '/cockpit/dashboard' },
          ].map(({ href, label, sub, Icon, match }) => (
            <Link key={href} href={href} className={`sidebar-link ${match(pathname || '') ? 'active' : ''}`}>
              <span className="nav-ico"><Icon size={18} strokeWidth={1.8} /></span>
              <span className="nav-txt">
                <span className="nav-label">{label}</span>
                <span className="nav-sub">{sub}</span>
              </span>
            </Link>
          ))}

          {session?.user?.email === 'pjsaro4@gmail.com' && (
            <Link
              href="/cockpit/owner"
              className={`sidebar-link nav-admin ${pathname === '/cockpit/owner' ? 'active' : ''}`}
            >
              <span className="nav-ico"><Shield size={18} strokeWidth={1.8} /></span>
              <span className="nav-txt">
                <span className="nav-label">Admin</span>
                <span className="nav-sub">Owner Access</span>
              </span>
            </Link>
          )}

          <div className="sidebar-footer">
            System Status <span className="status-ok">STABLE</span>
          </div>
        </aside>

        {/* key={pathname} remounts on route change so the enter animation
            actually re-fires — previously it only ran once on first load. */}
        <main key={pathname} className="cockpit-main page-enter">{children}</main>
      </div>

      {/* FOOTER */}
      <footer className="cockpit-footer">
        <span
          className={`footer-tab ${logsOpen ? 'active' : ''}`}
          onClick={() => setLogsOpen(v => !v)}
        >
          LOGS
        </span>

        <span
          className={`footer-tab copilot-tab ${copilotOpen ? 'active' : ''}`}
          onClick={() => setCopilotOpen(v => !v)}
          title="AI Copilot"
        >
          <Brain size={14} /> COPILOT
        </span>

        <span
          className="footer-tab"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          title="SYN Organism"
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#a78bfa',
            display: 'inline-block',
          }} />
          SYN
        </span>

        <span
          className={`footer-tab ${signalOpen ? 'active' : ''}`}
          onClick={() => setSignalOpen(v => !v)}
        >
          SIGNAL
        </span>

        <span
          className={`footer-tab ${globalChatOpen ? 'active' : ''}`}
          onClick={() => setGlobalChatOpen(v => !v)}
        >
          GLOBAL CHAT
        </span>
      </footer>

      {/* PANELS */}
      {logsOpen && <LogsPanel />}
      {signalOpen && <SignalPanel />}

      {/* GLOBAL COPILOT */}
      <GlobalCopilot isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* GLOBAL CHAT WIDGET */}
      <GlobalChatWidget isOpen={globalChatOpen} onClose={() => setGlobalChatOpen(false)} />

      {/* AUDIO CONTROL - Floating Widget */}
      <AudioControl />
      <ThemeToggle />
    </div>
  );
}

export default function CockpitLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session } = useSession();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const userName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'Operator';

  // Initialize on mount
  useEffect(() => {
    setShowWelcome(shouldShowWelcome());
    setIsReady(true);
  }, []);

  const handleWelcomeComplete = () => {
    markCockpitEntered();
    setShowWelcome(false);
  };

  // Don't render anything until we've checked for welcome
  if (!isReady) {
    return (
      <div className="cockpit-loading">
        <div className="loading-spinner" />
        <span>Initializing...</span>
      </div>
    );
  }

  // Show welcome experience if this is a fresh session
  if (showWelcome) {
    return (
      <WelcomeExperience
        userName={userName}
        onComplete={handleWelcomeComplete}
      />
    );
  }

  return (
    <ThemeProvider>
      <AccountProvider>
        <ToastProvider>
          <AmbientAudioProvider autoChangeMood defaultVolume={0.6}>
            <PageTransitionProvider defaultTransition="fade" defaultDuration={300}>
              <CockpitContent userName={userName}>{children}</CockpitContent>
            </PageTransitionProvider>
          </AmbientAudioProvider>
        </ToastProvider>
      </AccountProvider>
    </ThemeProvider>
  );
}
