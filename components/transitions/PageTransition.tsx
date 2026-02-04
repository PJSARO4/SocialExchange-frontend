"use client";

import React, { createContext, useContext, ReactNode } from 'react';

interface PageTransitionContextType {
  isTransitioning: boolean;
  startTransition: (callback?: () => void) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType>({
  isTransitioning: false,
  startTransition: () => {},
});

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  // Stub provider - no actual transition animation
  const value: PageTransitionContextType = {
    isTransitioning: false,
    startTransition: (callback) => {
      console.log('[PageTransition] Start transition');
      if (callback) callback();
    },
  };

  return (
    <PageTransitionContext.Provider value={value}>
      {children}
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  return useContext(PageTransitionContext);
}

export default PageTransitionProvider;
