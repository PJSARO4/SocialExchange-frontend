"use client";

import { createContext, useContext, useState } from "react";

type ViewMode = "docked" | "expanded";

type ViewContextType = {
  view: ViewMode;
  toggleView: () => void;
};

const ViewContext = createContext<ViewContextType | null>(null);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ViewMode>("docked");

  const toggleView = () =>
    setView((v) => (v === "docked" ? "expanded" : "docked"));

  return (
    <ViewContext.Provider value={{ view, toggleView }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const ctx = useContext(ViewContext);
  if (!ctx) throw new Error("useView must be used inside ViewProvider");
  return ctx;
}
