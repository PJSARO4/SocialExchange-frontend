'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import './page-transition.css';

// ============================================
// TRANSITION TYPES
// ============================================
export type TransitionType =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'cinematic'
  | 'warp';

export interface TransitionConfig {
  type: TransitionType;
  duration?: number;
  delay?: number;
}

// ============================================
// CONTEXT TYPE
// ============================================
interface PageTransitionContextType {
  isTransitioning: boolean;
  currentTransition: TransitionType;
  navigateWithTransition: (path: string, config?: TransitionConfig) => void;
  startTransition: (type?: TransitionType) => void;
  endTransition: () => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | null>(null);

// ============================================
// HOOK
// ============================================
export function usePageTransition() {
  const context = useContext(PageTransitionContext);
  if (!context) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================
interface PageTransitionProviderProps {
  children: ReactNode;
  defaultTransition?: TransitionType;
  defaultDuration?: number;
}

export function PageTransitionProvider({
  children,
  defaultTransition = 'fade',
  defaultDuration = 400
}: PageTransitionProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTransition, setCurrentTransition] = useState<TransitionType>(defaultTransition);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Navigate with transition
  const navigateWithTransition = useCallback((
    path: string,
    config: TransitionConfig = { type: defaultTransition }
  ) => {
    if (path === pathname) return;

    const { type, duration = defaultDuration, delay = 0 } = config;

    setCurrentTransition(type);
    setIsTransitioning(true);
    setTransitionPhase('out');
    setPendingNavigation(path);

    // After exit animation completes, navigate
    setTimeout(() => {
      router.push(path);
    }, duration + delay);
  }, [pathname, router, defaultTransition, defaultDuration]);

  // Manual transition controls
  const startTransition = useCallback((type: TransitionType = defaultTransition) => {
    setCurrentTransition(type);
    setIsTransitioning(true);
    setTransitionPhase('out');
  }, [defaultTransition]);

  const endTransition = useCallback(() => {
    setTransitionPhase('in');
    setTimeout(() => {
      setIsTransitioning(false);
      setTransitionPhase('idle');
    }, defaultDuration);
  }, [defaultDuration]);

  // Handle route change completion
  useEffect(() => {
    if (pendingNavigation && pathname === pendingNavigation) {
      setTransitionPhase('in');
      setPendingNavigation(null);

      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionPhase('idle');
      }, defaultDuration);
    }
  }, [pathname, pendingNavigation, defaultDuration]);

  return (
    <PageTransitionContext.Provider
      value={{
        isTransitioning,
        currentTransition,
        navigateWithTransition,
        startTransition,
        endTransition,
      }}
    >
      {children}

      {/* Transition Overlay */}
      <div
        className={`page-transition-overlay ${transitionPhase} ${currentTransition}`}
        aria-hidden="true"
      >
        {/* Cinematic Elements for special transitions */}
        {(currentTransition === 'cinematic' || currentTransition === 'warp') && (
          <div className="transition-cinematic">
            <div className="cinematic-lines">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="warp-line" style={{ '--index': i } as React.CSSProperties} />
              ))}
            </div>
            <div className="cinematic-glow" />
          </div>
        )}

        {/* Standard transition backgrounds */}
        <div className="transition-bg primary" />
        <div className="transition-bg secondary" />
      </div>
    </PageTransitionContext.Provider>
  );
}

// ============================================
// TRANSITION LINK COMPONENT
// ============================================
interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  transition?: TransitionType;
  className?: string;
  onClick?: () => void;
}

export function TransitionLink({
  href,
  children,
  transition = 'fade',
  className = '',
  onClick
}: TransitionLinkProps) {
  const { navigateWithTransition } = usePageTransition();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick?.();
    navigateWithTransition(href, { type: transition });
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

// ============================================
// PAGE WRAPPER COMPONENT (for enter animations)
// ============================================
interface AnimatedPageProps {
  children: ReactNode;
  animation?: 'fade' | 'slide-up' | 'scale';
  delay?: number;
  className?: string;
}

export function AnimatedPage({
  children,
  animation = 'fade',
  delay = 0,
  className = ''
}: AnimatedPageProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`animated-page ${animation} ${isVisible ? 'visible' : ''} ${className}`}
      style={{ '--delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export default PageTransitionProvider;
