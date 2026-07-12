'use client';

import Link from 'next/link';
import { ReactNode, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import './cockpit.css';


import ActivityLightbar from './ui/ActivityLightbar';
import LivePulse from './ui/LivePulse';
import LogsPanel from './ui/LogsPanel';
import SignalPanel from './ui/SignalPanel';
import GlobalCopilot from './ui/GlobalCopilot';
import WelcomeExperience from '@/components/welcome/WelcomeExperience';
import { PageTransitionProvider } from '@/components/transitions/PageTransition';
import { AmbientAudioProvider, useAmbientAudio } from '@/lib/audio/useAmbientAudio';
import AudioControl from '@/components/audio/AudioControl';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Brain } from 'lucide-react';
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
    <div className="cockpit-root">
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
        <div className="logo">SOCIAL · EXCHANGE</div>
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

          <Link
            href="/cockpit/home"
            className={`sidebar-link ${
              pathname === '/cockpit/home' ? 'active' : ''
            }`}
          >
            Home
          </Link>

          <Link
            href="/cockpit/dashboard"
            className={`sidebar-link ${
              pathname === '/cockpit/dashboard' ? 'active' : ''
            }`}
          >
            Command Center
          </Link>

          <Link
            href="/cockpit/my-e-assets"
            className={`sidebar-link ${
              pathname === '/cockpit/my-e-assets' ||
              pathname?.startsWith('/cockpit/my-e-assets/')
                ? 'active'
                : ''
            }`}
          >
            My E-Assets
          </Link>

          <Link
            href="/cockpit/trading-post"
            className={`sidebar-link ${
              pathname === '/cockpit/trading-post' ||
              pathname?.startsWith('/cockpit/trading-post/')
                ? 'active'
                : ''
            }`}
          >
            The Exchange Floor
          </Link>

          <Link
            href="/cockpit/comms"
            className={`sidebar-link ${
              pathname === '/cockpit/comms' ? 'active' : ''
            }`}
          >
            Comms
          </Link>

          {session?.user?.email === 'pjsaro4@gmail.com' && (
            <Link
              href="/cockpit/owner"
              className={`sidebar-link ${pathname === '/cockpit/owner' ? 'active' : ''}`}
              style={{ color: '#f59e0b', marginTop: '0.5rem' }}
            >
              ⚙ Admin
            </Link>
          )}

          <div className="sidebar-footer">
            System Status <span className="status-ok">STABLE</span>
          </div>
        </aside>

        <main className="cockpit-main page-enter">{children}</main>
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
