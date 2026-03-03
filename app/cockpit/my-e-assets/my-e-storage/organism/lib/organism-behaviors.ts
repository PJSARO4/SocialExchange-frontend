'use client';

import type { OrganismBehavior } from '../types/organism';

// ============================================
// PRESET BEHAVIORS
// Shipped by default. Users can toggle on/off.
// ============================================

export const DEFAULT_BEHAVIORS: OrganismBehavior[] = [
  {
    id: 'auto-compress',
    name: 'Auto-Compress Uploads',
    description:
      'Automatically compress new images to fit social media specs when added to storage.',
    icon: '🗜',
    enabled: true,
    triggerCondition: 'New image added to E-Storage',
    requiresApproval: false,
  },
  {
    id: 'auto-tag',
    name: 'Auto-Tag Content',
    description:
      'Analyze filenames and file types to automatically assign relevant tags.',
    icon: '🏷',
    enabled: true,
    triggerCondition: 'New file added to E-Storage',
    requiresApproval: false,
  },
  {
    id: 'auto-organize',
    name: 'Smart Organize',
    description:
      'Suggest folder organization when 10+ files are unsorted. Groups by type and date.',
    icon: '📂',
    enabled: false,
    triggerCondition: '10+ unsorted files detected',
    requiresApproval: false,
  },
  {
    id: 'content-suggest',
    name: 'Content Suggestions',
    description:
      'Proactively suggest trending content based on your tags and preferences.',
    icon: '💡',
    enabled: true,
    triggerCondition: 'User opens E-Storage',
    requiresApproval: false,
  },
  {
    id: 'quota-watch',
    name: 'Storage Quota Alerts',
    description:
      'Alert when device storage exceeds 80%. Suggest cleanup operations.',
    icon: '📊',
    enabled: true,
    triggerCondition: 'Storage usage > 80%',
    requiresApproval: false,
  },
  {
    id: 'duplicate-detect',
    name: 'Duplicate Detection',
    description:
      'Check for files with similar names or sizes when new files are added.',
    icon: '🔍',
    enabled: false,
    triggerCondition: 'New file added to E-Storage',
    requiresApproval: false,
  },
  {
    id: 'format-check',
    name: 'Format Compliance',
    description:
      'Check if images meet social media platform specs and suggest compression.',
    icon: '✅',
    enabled: true,
    triggerCondition: 'Image added to E-Storage',
    requiresApproval: false,
  },
];

// ============================================
// BEHAVIOR HELPERS
// ============================================

export function getBehaviorById(
  behaviors: OrganismBehavior[],
  id: string
): OrganismBehavior | undefined {
  return behaviors.find((b) => b.id === id);
}

export function getEnabledBehaviors(
  behaviors: OrganismBehavior[]
): OrganismBehavior[] {
  return behaviors.filter((b) => b.enabled);
}
