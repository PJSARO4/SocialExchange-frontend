"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

type PilotProfile = {
  callsign: string;
  role: string;
  initialized: true;
};

export default function TopHud() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [pilot, setPilot] = useState<PilotProfile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("socialexchange.pilot");
    if (stored) setPilot(JSON.parse(stored));
  }, []);

  const handlePower = async () => {
    await logout();
    localStorage.removeItem("socialexchange.pilot");
    localStorage.removeItem("socialexchange.panels");
    router.push("/");
  };

  return (
    <div className="flex items-center justify-between px-6 py-3 text-xs tracking-widest">
      {/* LEFT: SYSTEM STATUS */}
      <div className="flex items-center gap-3 text-green-400">
        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        SYSTEM ONLINE
      </div>

      {/* CENTER */}
      <div className="text-gray-400">
        SOCIAL EXCHANGE · MISSION CONTROL
      </div>

      {/* RIGHT: IDENTITY + POWER */}
      <div className="flex items-center gap-4">
        {pilot && (
          <span className="text-blue-400">
            {pilot.callsign} · {pilot.role}
          </span>
        )}

        {user ? (
          <button
            onClick={handlePower}
            className="border border-red-400 text-red-400 px-3 py-1 hover:bg-red-400 hover:text-black transition"
            title="POWER DOWN"
          >
            ⏻
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="border border-blue-400 text-blue-400 px-3 py-1"
          >
            LOGIN
          </button>
        )}
      </div>
    </div>
  );
}
