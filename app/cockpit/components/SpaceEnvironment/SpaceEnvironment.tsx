'use client';

/**
 * SpaceEnvironment — the living space scene behind the cockpit.
 *
 * Purely a visual layer: fixed, inset 0, pointer-events none, z-index 0.
 * It never intercepts clicks and knows nothing about cockpit UI.
 *
 * Layers (back to front):
 *   deep space  ->  nebula  ->  starfield (canvas)  ->  planet + atmosphere  ->  veil
 *
 * The `mode` prop is deliberately inert for now. It exists so activity-driven
 * states (market / comms / alert / idle) can be layered on later without
 * restructuring anything.
 */

import { useEffect, useRef } from 'react';
import styles from './SpaceEnvironment.module.css';
import { createStarfield } from './starfield';

export type SpaceMode = 'normal' | 'idle' | 'market' | 'comms' | 'alert';

interface SpaceEnvironmentProps {
  mode?: SpaceMode;
}

export default function SpaceEnvironment({ mode = 'normal' }: SpaceEnvironmentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const teardown = createStarfield(canvas, { reducedMotion });
    return teardown;
  }, []);

  return (
    <div className={styles.root} data-mode={mode} aria-hidden="true">
      <div className={styles.deepSpace} />

      <div className={`${styles.nebula} ${styles.nebulaA}`} />
      <div className={`${styles.nebula} ${styles.nebulaB}`} />

      <canvas ref={canvasRef} className={styles.stars} />

      <div className={styles.planet}>
        <div className={styles.planetSurface} />
        <div className={styles.planetShade} />
      </div>
      <div className={styles.atmosphere} />

      <div className={styles.veil} />
    </div>
  );
}
