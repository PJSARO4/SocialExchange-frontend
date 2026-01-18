"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TopHud from "@/components/hud/TopHud";
import SystemsRail from "@/components/hud/SystemsRail";
import SignalDock from "@/components/hud/SignalDock";

export default function CockpitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const pilot = localStorage.getItem("socialexchange.pilot");
    if (!pilot) {
      router.replace("/setup");
    }
  }, [router]);

  return (
    <div className="min-h-screen w-full bg-black text-gray-200 overflow-hidden">
      {/* Space backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.04),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.03),transparent_40%)]" />

      {/* Cockpit Frame */}
      <div className="relative z-10 grid grid-rows-[auto_1fr_auto] h-screen">
        <header className="border-b border-gray-800 bg-black/80 backdrop-blur-sm">
          <TopHud />
        </header>

        <div className="grid grid-cols-[240px_1fr] h-full">
          <aside className="border-r border-gray-800 bg-black/70">
            <SystemsRail />
          </aside>

          <main className="relative p-6 overflow-y-auto">
            <div className="absolute inset-0 pointer-events-none border border-gray-800 opacity-40" />
            {children}
          </main>
        </div>

        <footer className="border-t border-gray-800 bg-black/80 backdrop-blur-sm">
          <SignalDock />
        </footer>
      </div>
    </div>
  );
}
