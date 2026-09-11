'use client';

import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/app/context/AuthContext';
import { EStorageProvider } from '@/app/context/EStorageContext';
import { OrganismProvider } from '@/app/context/OrganismContext';
import { SynFeedProvider } from '@/app/syn/SynFeedContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AuthProvider>
        <EStorageProvider>
          {/* SynFeedProvider is OUTSIDE OrganismProvider on purpose: SYN chat
              reads the focused-feed context from OrganismContext, so the feed
              context must be an ancestor. Reversing these breaks feed grounding. */}
          <SynFeedProvider>
            <OrganismProvider>
              {children}
            </OrganismProvider>
          </SynFeedProvider>
        </EStorageProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
