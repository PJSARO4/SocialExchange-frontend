"use client";

import React from 'react';
import './mood-background.css';

interface MoodBackgroundProps {
  mood?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * MoodBackground
 * Renders a fixed, full-viewport, atmospheric animated "space" backdrop
 * BEHIND {children}. GPU-cheap: only transform + opacity are animated,
 * blur is applied statically. Honors prefers-reduced-motion.
 *
 * Stays a passthrough wrapper — children always render.
 */
export default function MoodBackground({ mood, className, children }: MoodBackgroundProps) {
  const moodClass = mood ? ` mood-bg--${mood}` : '';

  return (
    <>
      <div className={`mood-bg${moodClass}${className ? ` ${className}` : ''}`} aria-hidden="true">
        {/* Aurora light blobs — pre-blurred, drift slowly via transform */}
        <div className="mood-bg__aurora mood-bg__aurora--cyan" />
        <div className="mood-bg__aurora mood-bg__aurora--violet" />
        <div className="mood-bg__aurora mood-bg__aurora--mint" />

        {/* Layered starfield — drifts very slowly via transform */}
        <div className="mood-bg__stars mood-bg__stars--far" />
        <div className="mood-bg__stars mood-bg__stars--near" />
      </div>
      {children}
    </>
  );
}
