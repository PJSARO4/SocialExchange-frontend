"use client";

import { useEffect, useRef, useState } from "react";
import CinematicBackground from "./CinematicBackground";

type Props = {
  className?: string;
  entered: boolean;
  onEnter: () => void;
};

export default function HomeHeader({ className = "", entered, onEnter }: Props): JSX.Element {
  const headerClass = `w-full${className ? " " + className : ""}`;

  const [reduceMotion, setReduceMotion] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduceMotion(Boolean(mq.matches));
    handler();
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, []);

  // Click handler
  function handleStart(e: React.MouseEvent) {
    e.preventDefault();
    if (entered || localPressed) return;
    setLocalPressed(true);
    onEnter();
  }

  // Visual classes: collapse when entered
  const headerMaxClass = entered ? "max-h-[40vh]" : "max-h-screen";
  const opacityClass = entered ? "opacity-80" : "opacity-100";
  const contentVisibility = entered ? "hidden" : "block";
  const [localPressed, setLocalPressed] = useState(false);

  return (
    <header className={`relative min-h-screen flex items-center justify-center bg-black overflow-hidden ${headerClass}`}>
      <div
        ref={contentRef}
        className={`w-full transition-opacity duration-500 ease-out ${opacityClass}`}
        style={reduceMotion ? { transition: "none" } : undefined}
      >
        <CinematicBackground />
      </div>

      {/* subtle darken overlay during entry reveal */}
      <div className={`hero-dim absolute inset-0 z-20 pointer-events-none ${entered ? 'opacity-30 bg-black' : 'opacity-0'}`} />

      <div className="relative z-10 w-full max-w-3xl px-6 text-center">
        <div className="mx-auto py-12 sm:py-16 flex items-center justify-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_10px_30px_rgba(2,6,23,0.6)]">
            SocialExchange
          </h1>
        </div>

        {/* Controls are positioned absolutely so hiding them doesn't affect hero layout */}
        <div className="absolute left-0 right-0 bottom-14 flex justify-center z-30">
          <div className={`text-center transition-opacity duration-300 ${entered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <p className="mb-3 text-sm text-slate-300">Enter the exchange</p>
            <button
              type="button"
              onClick={handleStart}
              disabled={entered}
              className={`inline-block px-8 py-4 rounded-xl font-semibold text-white shadow-2xl transform transition-opacity duration-200 bg-gradient-to-r from-slate-800 via-slate-700 to-sky-600 ${entered ? 'opacity-0 pointer-events-none' : ''}`}
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
