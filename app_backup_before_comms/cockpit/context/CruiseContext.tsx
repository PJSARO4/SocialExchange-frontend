'use client';

import { createContext, useContext, useState } from 'react';

type CruiseContextType = {
  cruiseActive: boolean;
  toggleCruise: () => void;
};

const CruiseContext = createContext<CruiseContextType | null>(null);

export function CruiseProvider({ children }: { children: React.ReactNode }) {
  const [cruiseActive, setCruiseActive] = useState(false);

  const toggleCruise = () => {
    setCruiseActive(prev => !prev);
  };

  return (
    <CruiseContext.Provider value={{ cruiseActive, toggleCruise }}>
      {children}
    </CruiseContext.Provider>
  );
}

export function useCruise() {
  const ctx = useContext(CruiseContext);
  if (!ctx) {
    throw new Error('useCruise must be used inside CruiseProvider');
  }
  return ctx;
}
