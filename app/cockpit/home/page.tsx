'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Rocket,
  Link2,
  Search,
  Gem,
  MessageCircle,
  Radio,
  TrendingUp,
  Store,
  MessagesSquare,
  ArrowLeftRight,
  Monitor,
  Music,
  Brain,
  BarChart3,
  Check,
  ChevronRight,
  Satellite,
} from 'lucide-react';
import './home.css';
import WelcomeVideoModal from '@/components/home/WelcomeVideoModal';

// Onboarding step tracking
interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  completed: boolean;
  href: string;
}

const ONBOARDING_STORAGE_KEY = 'se-onboarding-progress';

function getOnboardingProgress(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function markStepComplete(stepId: string) {
  const progress = getOnboardingProgress();
  progress[stepId] = true;
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
}

// Icon wrapper for consistent sizing & color
function FeatureIcon({ children, color }: { children: ReactNode; color: string }) {
  return (
    <div className="home-feature-icon" style={{ color }}>
      {children}
    </div>
  );
}

// Feature cards data
const FEATURES = [
  {
    id: 'e-feeds',
    title: 'E-Feeds',
    icon: <Radio size={28} strokeWidth={1.5} />,
    description: 'Connect and manage all your social media accounts from one command center. Schedule posts, track engagement, and automate your content pipeline.',
    href: '/cockpit/my-e-assets/my-feeds',
    color: '#00ffc8',
  },
  {
    id: 'e-shares',
    title: 'E-Shares',
    icon: <Gem size={28} strokeWidth={1.5} />,
    description: 'Invest in creator communities with Community Credits. Support your favorite brands, earn tier status, and watch your portfolio grow.',
    href: '/cockpit/my-e-assets/my-e-shares',
    color: '#a78bfa',
  },
  {
    id: 'market',
    title: 'Marketplace',
    icon: <Store size={28} strokeWidth={1.5} />,
    description: 'Buy, sell, and trade digital social assets securely. Browse trending listings, make offers, and build your digital portfolio.',
    href: '/cockpit/trading-post',
    color: '#f59e0b',
  },
  {
    id: 'comms',
    title: 'Comms',
    icon: <MessagesSquare size={28} strokeWidth={1.5} />,
    description: 'Real-time messaging with traders, creators, and community members. Negotiate deals, share insights, and stay connected.',
    href: '/cockpit/comms',
    color: '#3b82f6',
  },
  {
    id: 'trading-post',
    title: 'Trading Post',
    icon: <ArrowLeftRight size={28} strokeWidth={1.5} />,
    description: 'Peer-to-peer trading hub for social media assets. Post your offers, browse what others are trading, and close deals directly.',
    href: '/cockpit/trading-post',
    color: '#ef4444',
  },
  {
    id: 'dashboard',
    title: 'Command Center',
    icon: <Monitor size={28} strokeWidth={1.5} />,
    description: 'Your real-time data dashboard. Stats, activity feeds, market trends, and portfolio performance — all in one view.',
    href: '/cockpit/dashboard',
    color: '#06b6d4',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [greeting, setGreeting] = useState('');
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status !== 'authenticated') return;

    // Set greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Load onboarding progress
    const progress = getOnboardingProgress();
    setOnboardingSteps([
      {
        id: 'explore-platform',
        label: 'Explore the Platform',
        description: 'Take a look around and get familiar with your cockpit',
        icon: <Rocket size={20} strokeWidth={1.5} />,
        completed: progress['explore-platform'] || false,
        href: '/cockpit/dashboard',
      },
      {
        id: 'connect-feed',
        label: 'Connect Your First Feed',
        description: 'Link an Instagram, TikTok, X, or YouTube account',
        icon: <Link2 size={20} strokeWidth={1.5} />,
        completed: progress['connect-feed'] || false,
        href: '/cockpit/my-e-assets/my-feeds',
      },
      {
        id: 'browse-market',
        label: 'Browse the Marketplace',
        description: 'Check out what social assets are available',
        icon: <Search size={20} strokeWidth={1.5} />,
        completed: progress['browse-market'] || false,
        href: '/cockpit/trading-post',
      },
      {
        id: 'join-community',
        label: 'Join a Community',
        description: 'Purchase Community Credits to support a creator',
        icon: <Gem size={20} strokeWidth={1.5} />,
        completed: progress['join-community'] || false,
        href: '/cockpit/my-e-assets/my-e-shares',
      },
      {
        id: 'send-message',
        label: 'Send Your First Message',
        description: 'Connect with other members in Comms',
        icon: <MessageCircle size={20} strokeWidth={1.5} />,
        completed: progress['send-message'] || false,
        href: '/cockpit/comms',
      },
    ]);

    // Trigger entrance animation
    requestAnimationFrame(() => setAnimateIn(true));
  }, [router]);

  const handleStepClick = useCallback((stepId: string) => {
    markStepComplete(stepId);
    setOnboardingSteps(prev =>
      prev.map(s => s.id === stepId ? { ...s, completed: true } : s)
    );
  }, []);

  const completedCount = onboardingSteps.filter(s => s.completed).length;
  const totalSteps = onboardingSteps.length;
  const progressPct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="home-loading">
        <div className="home-loading-spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'Operator';


  return (
    <>
      {/* Welcome Video Modal - rendered outside home-page to avoid transform containing block */}
      <WelcomeVideoModal />
    <div className={`home-page ${animateIn ? 'animate-in' : ''}`}>

      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">WELCOME TO SOCIAL EXCHANGE</div>
          <h1 className="home-hero-greeting">
            {greeting}, <span className="home-hero-name">{firstName}</span>
          </h1>
          <p className="home-hero-tagline">
            Your mission control for social media management, digital asset trading, and creator community building.
          </p>
          <div className="home-hero-actions">
            <Link href="/cockpit/dashboard" className="home-btn home-btn-primary">
              Open Command Center
            </Link>
            <Link href="/cockpit/my-e-assets/my-feeds" className="home-btn home-btn-secondary">
              Connect a Feed
            </Link>
          </div>
        </div>
        <div className="home-hero-visual">
          <div className="hero-orbit">
            <div className="hero-orbit-ring ring-1" />
            <div className="hero-orbit-ring ring-2" />
            <div className="hero-orbit-ring ring-3" />
            <div className="hero-orbit-center">SX</div>
            <div className="hero-orbit-dot dot-1"><Satellite size={18} strokeWidth={1.5} /></div>
            <div className="hero-orbit-dot dot-2"><Gem size={18} strokeWidth={1.5} /></div>
            <div className="hero-orbit-dot dot-3"><TrendingUp size={18} strokeWidth={1.5} /></div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="home-onboarding">
        <div className="home-section-header">
          <h2 className="home-section-title">Getting Started</h2>
          <div className="home-progress">
            <div className="home-progress-bar">
              <div
                className="home-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="home-progress-text">
              {completedCount}/{totalSteps} completed
            </span>
          </div>
        </div>

        <div className="home-steps">
          {onboardingSteps.map((step, index) => (
            <Link
              key={step.id}
              href={step.href}
              className={`home-step ${step.completed ? 'completed' : ''}`}
              onClick={() => handleStepClick(step.id)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="home-step-number">
                {step.completed ? (
                  <Check size={16} strokeWidth={2.5} />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="home-step-icon">{step.icon}</div>
              <div className="home-step-content">
                <h3 className="home-step-label">{step.label}</h3>
                <p className="home-step-desc">{step.description}</p>
              </div>
              <ChevronRight size={18} strokeWidth={1.5} className="home-step-arrow" />
            </Link>
          ))}
        </div>
      </section>

      {/* Feature Explainers */}
      <section className="home-features">
        <div className="home-section-header">
          <h2 className="home-section-title">Explore Your Cockpit</h2>
          <p className="home-section-subtitle">Everything you need to manage your digital social presence</p>
        </div>

        <div className="home-features-grid">
          {FEATURES.map((feature, index) => (
            <Link
              key={feature.id}
              href={feature.href}
              className="home-feature-card"
              style={{
                '--accent': feature.color,
                animationDelay: `${index * 0.08}s`,
              } as React.CSSProperties}
            >
              <FeatureIcon color={feature.color}>{feature.icon}</FeatureIcon>
              <h3 className="home-feature-title">{feature.title}</h3>
              <p className="home-feature-desc">{feature.description}</p>
              <span className="home-feature-go">
                Launch <ChevronRight size={14} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Tips */}
      <section className="home-tips">
        <div className="home-section-header">
          <h2 className="home-section-title">Quick Tips</h2>
        </div>
        <div className="home-tips-grid">
          <div className="home-tip">
            <span className="home-tip-icon"><Music size={22} strokeWidth={1.5} /></span>
            <div className="home-tip-content">
              <strong>Ambient Audio</strong>
              <p>Use the audio controls in the bottom-left to set the mood. Shuffle through 15 ambient tracks while you work.</p>
            </div>
          </div>
          <div className="home-tip">
            <span className="home-tip-icon"><Brain size={22} strokeWidth={1.5} /></span>
            <div className="home-tip-content">
              <strong>AI Copilot</strong>
              <p>Click COPILOT in the footer bar for AI-powered assistance with any task on the platform.</p>
            </div>
          </div>
          <div className="home-tip">
            <span className="home-tip-icon"><BarChart3 size={22} strokeWidth={1.5} /></span>
            <div className="home-tip-content">
              <strong>Command Center</strong>
              <p>Your real-time dashboard with live stats, activity feeds, and market data. Access it from the sidebar anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="home-footer-cta">
        <p className="home-footer-text">Ready to dive in?</p>
        <Link href="/cockpit/dashboard" className="home-btn home-btn-primary">
          Go to Command Center <ChevronRight size={16} strokeWidth={2} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </Link>
      </section>
    </div>
    </>
  );
}
