'use client';

import { useOrganism } from '@/app/context/OrganismContext';
import OrganismCity from './OrganismCity';
import OrganismActivityBubble from './OrganismActivityBubble';
import { OrganismErrorBoundary } from './OrganismErrorBoundary';

// ============================================
// E-STORAGE INTEGRATION WRAPPER
// Renders organism city + panel + activity bubbles
// ============================================

export default function OrganismEStorageIntegration() {
  // Panel state lives in OrganismContext; this wrapper only renders the avatar.
  useOrganism();

  return (
    <OrganismErrorBoundary fallbackMessage="SYN organism encountered an error">
      <>
        {/* The Grid — bottom-left of E-Storage area */}
        <div
          style={{
            position: 'fixed',
            bottom: '60px', // above footer
            left: '280px', // offset for sidebar
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          <OrganismCity />
          <OrganismActivityBubble />
        </div>

        {/* The SYN panel is mounted globally in CockpitLayoutClient so the
            footer SYN control and this avatar open the same panel. Rendering it
            here as well would put two identical panels on the E-Storage page. */}
      </>
    </OrganismErrorBoundary>
  );
}
