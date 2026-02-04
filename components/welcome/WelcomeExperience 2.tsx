"use client";

import React, { useEffect } from 'react';

interface WelcomeExperienceProps {
  userName?: string;
  onComplete?: () => void;
  children?: React.ReactNode;
}

export default function WelcomeExperience({ userName = 'Operator', onComplete, children }: WelcomeExperienceProps) {
  // Auto-complete after a brief moment (skip the welcome animation)
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onComplete]);

  // If no onComplete, render children
  if (!onComplete) {
    return <>{children}</>;
  }

  // Show brief loading while auto-completing
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a0f',
      color: '#00ffc8'
    }}>
      <div>Welcome, {userName}...</div>
    </div>
  );
}
