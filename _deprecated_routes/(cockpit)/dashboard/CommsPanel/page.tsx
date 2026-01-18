"use client";

import { useRouter } from "next/navigation";

export default function CommsPanel() {
  const router = useRouter();

  return (
    <div className="border border-gray-800 p-4 font-mono space-y-4">
      {/* PANEL HEADER */}
      <div className="flex justify-between items-center">
        <div className="text-xs tracking-widest text-gray-400">
          COMMS MONITOR
        </div>

        <div className="text-xs text-green-400 tracking-widest">
          ONLINE
        </div>
      </div>

      {/* STATUS LINE */}
      <div className="text-sm text-gray-300">
        Monitoring open airspace transmissions.
      </div>

      {/* MESSAGE PREVIEW */}
      <div className="space-y-2 border border-gray-800 p-3">
        <CommPreviewLine
          sender="ATLAS-01"
          message="Market activity increasing in sector 7."
        />
        <CommPreviewLine
          sender="ORION-7"
          message="Escrow volume steady. No anomalies."
        />
        <CommPreviewLine
          sender="CONTROL"
          message="Universal channel stable."
          system
        />
      </div>

      {/* ACTION */}
      <div className="flex justify-end">
        <button
          onClick={() => router.push("/comm")}
          className="border border-blue-400 px-4 py-1 text-xs tracking-widest text-blue-400 hover:bg-blue-400/10"
        >
          ENGAGE COMMS →
        </button>
      </div>
    </div>
  );
}

/* =======================
   SUB COMPONENT
======================= */

function CommPreviewLine({
  sender,
  message,
  system = false,
}: {
  sender: string;
  message: string;
  system?: boolean;
}) {
  return (
    <div className="text-sm text-gray-300">
      <span
        className={`mr-2 ${
          system ? "text-yellow-400" : "text-blue-400"
        }`}
      >
        [{sender}]
      </span>
      {message}
    </div>
  );
}
