"use client";

import React, { useState, useEffect } from 'react';

const TUTORIAL_STORAGE_KEY = 'se-myfeeds-tutorial-seen';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  highlight?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to My Feeds',
    description: 'Your command center for managing all your social media accounts in one place.',
    icon: '🚀',
  },
  {
    id: 'accounts',
    title: 'Connect Your Accounts',
    description: 'Add your social media accounts from the left panel. Click the + button to connect Instagram, Twitter, and more.',
    icon: '📱',
    highlight: 'feeds-panel',
  },
  {
    id: 'workspace',
    title: 'Workspace Tab',
    description: 'View account metrics, toggle automation, and access quick actions for each connected account.',
    icon: '📊',
    highlight: 'workspace-tab',
  },
  {
    id: 'content',
    title: 'Content Library',
    description: 'Store and organize your media. Upload images, videos, and manage your content for scheduling.',
    icon: '📚',
    highlight: 'content-tab',
  },
  {
    id: 'scheduler',
    title: 'Scheduler',
    description: 'Plan your posts with a calendar view. Drag and drop content to schedule optimal posting times.',
    icon: '📅',
    highlight: 'scheduler-tab',
  },
  {
    id: 'automation',
    title: 'Automation Modes',
    description: 'Choose how automated you want each account: Automated (full auto), Independent (manual with AI help), or Observe (monitoring only).',
    icon: '⚡',
  },
  {
    id: 'features',
    title: 'Quick Actions',
    description: 'Access AI Copilot for content help, Automation for workflows, Content Finder for discovering trends, and Analytics for insights.',
    icon: '🎯',
  },
];

export function PageTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if tutorial has been seen
    const seen = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!seen) {
      // Show tutorial after a short delay
      const timer = setTimeout(() => setShowTutorial(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  if (!showTutorial) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="page-tutorial-overlay">
      <div className="page-tutorial-modal">
        <div className="tutorial-progress">
          {TUTORIAL_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`progress-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-step-content">
          <div className="tutorial-step-icon">{step.icon}</div>
          <h2 className="tutorial-step-title">{step.title}</h2>
          <p className="tutorial-step-description">{step.description}</p>
        </div>

        <div className="tutorial-actions">
          <button className="tutorial-skip-btn" onClick={handleSkip}>
            Skip Tour
          </button>
          <div className="tutorial-nav-btns">
            {!isFirstStep && (
              <button className="tutorial-nav-btn" onClick={handlePrev}>
                ← Back
              </button>
            )}
            <button className="tutorial-nav-btn primary" onClick={handleNext}>
              {isLastStep ? 'Get Started!' : 'Next →'}
            </button>
          </div>
        </div>

        <div className="tutorial-step-counter">
          {currentStep + 1} of {TUTORIAL_STEPS.length}
        </div>
      </div>
    </div>
  );
}

export default PageTutorial;
