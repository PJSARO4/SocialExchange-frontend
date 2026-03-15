'use client';

import { type ReactNode } from 'react';
import { useOrganism } from '@/app/context/OrganismContext';
import {
  Archive,
  Tag,
  FolderOpen,
  CheckCircle,
  Search,
  BarChart3,
  Trash2,
  Clipboard,
  AlertTriangle,
} from 'lucide-react';

// ============================================
// ACTIVITY BUBBLE — Floating notification near The Grid
// ============================================

const NOTIF_ICON_MAP: Record<string, ReactNode> = {
  archive: <Archive size={14} />,
  tag: <Tag size={14} />,
  folder: <FolderOpen size={14} />,
  'check-circle': <CheckCircle size={14} />,
  search: <Search size={14} />,
  'bar-chart': <BarChart3 size={14} />,
  'trash-2': <Trash2 size={14} />,
  clipboard: <Clipboard size={14} />,
  'alert-triangle': <AlertTriangle size={14} />,
};

export default function OrganismActivityBubble() {
  const { notifications } = useOrganism();

  const visible = notifications.filter((n) => !n.dismissed);
  if (visible.length === 0) return null;

  // Show only the latest one
  const latest = visible[visible.length - 1];

  return (
    <div className="organism-activity-bubble" key={latest.id}>
      <span>{NOTIF_ICON_MAP[latest.icon] || latest.icon}</span>
      <span>{latest.message}</span>
    </div>
  );
}
