'use client';

import { useState, useCallback } from 'react';
import IdleOverlay from './IdleOverlay';

export default function SystemSurface({
  children,
}: {
  children: React.ReactNode;
}) {
  const [idleActive, setIdleActive] = useState(true);

  const enterMissionControl = useCallback(() => {
    setIdleActive(false);
  }, []);

  if (idleActive) {
    return <IdleOverlay onEnter={enterMissionControl} />;
  }

  return <>{children}</>;
}
