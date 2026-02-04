'use client';

import Link from 'next/link';
import { ReactNode, useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import './cockpit.css';

import Ticker from './ui/Ticker';
import LogsPanel from './ui/LogsPanel';
import SignalPanel from './ui/SignalPanel';
import GlobalCopilot from './ui/GlobalCopilot';
import WelcomeExperience from '@/components/welcome/WelcomeExperience';
import { PageTransitionProvider } from '@/components/transitions/PageTransition';
import { AmbientAudioProvider, useAmbientAudio } from '@/lib/audio/useAmbientAudio';
import AudioControl from '@/components/audio/AudioControl';
import MoodBackground from '@/components/audio/MoodBackground';

// ✅ CORRECT PATH (file lives in app/cockpit/context)
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

// Get user name from auth (mock for now)
const getUserName = () => {
  if (typeof window === 'undefined') return 'Operator';
  try {
    const authData = localStorage.getItem('social-exchange-auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.user?.displayName || 'Operator';
    }
  } catch {
    // Ignore errors
  }
  return 'Operator';
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

// Inner component that uses audio context
function CockpitContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setMoodForPath } = useAmbientAudio();
  const { isOpen: mobileMenuOpen, toggle: toggleMobileMenu, close: closeMobileMenu } = useMobileMenu();

  const [logsOpen, setLogsOpen] = useState(false);
  const [signalOpen, setSignalOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Update audio mood based on path
  useEffect(() => {
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
        <div className="logo">SOCIAL · EXCHANGE</div>
        <div className="topbar-center">
          <Ticker />
        </div>
        <div className="exit-cockpit">
          <Link href="/">Exit Cockpit</Link>
        </div>
      </header>

      {/* BODY */}
      <div className="cockpit-body">
        <aside className={`cockpit-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-title">NAVIGATION</div>

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
            Trading Post
          </Link>

          <Link
            href="/cockpit/market"
            className={`sidebar-link ${
              pathname === '/cockpit/market' ? 'active' : ''
            }`}
          >
            Market
          </Link>

          <Link
            href="/cockpit/comms"
            className={`sidebar-link ${
              pathname === '/cockpit/comms' ? 'active' : ''
            }`}
          >
            Comms
          </Link>

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
          🧠 COPILOT
        </span>

        <span
          className={`footer-tab ${signalOpen ? 'active' : ''}`}
          onClick={() => setSignalOpen(v => !v)}
        >
          SIGNAL
        </span>
      </footer>

      {/* PANELS */}
      {logsOpen && <LogsPanel />}
      {signalOpen && <SignalPanel />}

      {/* GLOBAL COPILOT */}
      <GlobalCopilot isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />

      {/* AUDIO CONTROL */}
      <AudioControl position="bottom-left" showMood />
    </div>
  );
}

export default function CockpitLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('Operator');
  const [isReady, setIsReady] = useState(false);

  // Initialize on mount
  useEffect(() => {
    setUserName(getUserName());
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
    <AccountProvider>
      <AmbientAudioProvider autoChangeMood defaultVolume={0.6}>
        <PageTransitionProvider defaultTransition="fade" defaultDuration={300}>
          <CockpitContent>{children}</CockpitContent>
        </PageTransitionProvider>
      </AmbientAudioProvider>
    </AccountProvider>
  );
}
