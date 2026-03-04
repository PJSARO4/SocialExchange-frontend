'use client';

import { useOrganism } from '@/app/context/OrganismContext';
import OrganismCity from './OrganismCity';
import OrganismActivityBubble from './OrganismActivityBubble';
import OrganismPanel from './OrganismPanel';

// ============================================
// E-STORAGE INTEGRATION WRAPPER
// Renders organism city + panel + activity bubbles
// ============================================

export default function OrganismEStorageIntegration() {
  const { isPanelOpen, closePanel } = useOrganism();

  return (
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

      {/* Panel */}
      <OrganismPanel isOpen={isPanelOpen} onClose={closePanel} />
    </>
  );
}
