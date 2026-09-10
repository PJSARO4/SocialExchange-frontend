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
          <OrganismProvider>
            <SynFeedProvider>
              {children}
            </SynFeedProvider>
          </OrganismProvider>
        </EStorageProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
