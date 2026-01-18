"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role =
  | "BUYER"
  | "SELLER"
  | "TRADER"
  | "PASSENGER"
  | "COMMUNICATOR"
  | "BOTH";

const ROLES: Role[] = [
  "BUYER",
  "SELLER",
  "TRADER",
  "PASSENGER",
  "COMMUNICATOR",
  "BOTH",
];

export default function CockpitSetupPage() {
  const router = useRouter();

  const [callsign, setCallsign] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const canProceed = callsign.trim() && role && acknowledged;

  const initialize = () => {
    const profile = {
      callsign: callsign.trim(),
      role,
      initialized: true,
    };

    localStorage.setItem(
      "socialexchange.pilot",
      JSON.stringify(profile)
    );

    router.push("/dashboard");
  };

  return (
    <div className="max-w-4xl mx-auto font-mono space-y-10">
      <section className="border border-gray-800 p-6">
        <div className="text-xs text-gray-500 mb-2">
          INITIALIZATION SEQUENCE · STEP 1 OF 3
        </div>
        <div className="text-lg text-gray-200">
          CONFIGURE FLIGHT IDENTITY
        </div>
      </section>

      <section className="border border-gray-800 p-6 space-y-4">
        <div className="text-xs text-gray-500">PILOT CALLSIGN</div>
        <input
          value={callsign}
          onChange={(e) => setCallsign(e.target.value.toUpperCase())}
          placeholder="ENTER CALLSIGN"
          className="w-full bg-black border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
        />
      </section>

      <section className="border border-gray-800 p-6 space-y-4">
        <div className="text-xs text-gray-500">MISSION ROLE</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`border px-4 py-3 text-sm tracking-wider ${
                role === r
                  ? "border-green-400 text-green-400"
                  : "border-gray-700 text-gray-400"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </section>

      <section className="border border-gray-800 p-6 space-y-4">
        <label className="flex items-center gap-3 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
          />
          I acknowledge operational constraints.
        </label>
      </section>

      <section className="flex justify-end">
        <button
          disabled={!canProceed}
          onClick={initialize}
          className={`px-8 py-3 text-sm tracking-widest border ${
            canProceed
              ? "border-blue-400 text-blue-400 hover:border-green-400 hover:text-green-400"
              : "border-gray-700 text-gray-600"
          }`}
        >
          INITIALIZE SYSTEMS
        </button>
      </section>
    </div>
  );
}
