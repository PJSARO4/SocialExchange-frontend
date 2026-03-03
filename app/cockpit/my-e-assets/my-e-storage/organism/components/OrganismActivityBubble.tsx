'use client';

import { useOrganism } from '@/app/context/OrganismContext';

// ============================================
// ACTIVITY BUBBLE — Floating notification near The Grid
// ============================================

export default function OrganismActivityBubble() {
  const { notifications } = useOrganism();

  const visible = notifications.filter((n) => !n.dismissed);
  if (visible.length === 0) return null;

  // Show only the latest one
  const latest = visible[visible.length - 1];

  return (
    <div className="organism-activity-bubble" key={latest.id}>
      <span>{latest.icon}</span>
      <span>{latest.message}</span>
    </div>
  );
}
