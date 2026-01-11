"use client";

import React, { useState } from "react";
import HomeHeader from "./HomeHeader";

type Props = {
  children?: React.ReactNode;
};

export default function EntryGate({ children }: Props) {
  const [hasEntered, setHasEntered] = useState(false);

  const handleEnter = () => setHasEntered(true);

  return (
    <div className="relative min-h-screen">
      <div
        className={`relative z-20 transition-opacity duration-700 ease-out transform ${
          hasEntered ? "opacity-0 -translate-y-3 pointer-events-none" : "opacity-100 translate-y-0"
        }`}
      >
        <HomeHeader entered={hasEntered} onEnter={handleEnter} />
      </div>

      <div
        className={`absolute inset-0 z-10 transition-opacity duration-700 ease-out ${
          hasEntered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      >
        <div className="w-full h-full bg-gradient-to-b from-transparent via-slate-900/40 to-black/90" />
      </div>

      <div className={`absolute inset-0 z-0 transition-opacity duration-700 ease-out`}>
        {hasEntered ? (
          children ?? <div className="w-full h-full" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
}
