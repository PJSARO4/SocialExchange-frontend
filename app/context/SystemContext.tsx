"use client";

import { createContext, useContext, useState } from "react";

export type System =
  | "dashboard"
  | "comms"
  | "assets"
  | "trade"
  | "escrow";

type SystemContextType = {
  system: System;
  setSystem: (s: System) => void;
};

const SystemContext = createContext<SystemContextType | null>(null);

export function SystemProvider({
  children,
  initialSystem = "dashboard"
}: {
  children: React.ReactNode;
  initialSystem?: System;
}) {
  const [system, setSystem] = useState<System>(initialSystem);

  return (
    <SystemContext.Provider value={{ system, setSystem }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error("useSystem must be used inside SystemProvider");
  return ctx;
}
