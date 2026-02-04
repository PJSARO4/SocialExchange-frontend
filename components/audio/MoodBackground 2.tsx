"use client";

import React from 'react';

interface MoodBackgroundProps {
  mood?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function MoodBackground({ mood, className, children }: MoodBackgroundProps) {
  // Stub component - renders children without mood effects
  return <div className={className}>{children}</div>;
}
