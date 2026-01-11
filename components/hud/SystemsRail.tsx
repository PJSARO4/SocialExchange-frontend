"use client";

import { useRouter, usePathname } from "next/navigation";

const SYSTEMS = [
  { label: "DASHBOARD", path: "/dashboard" },
  { label: "MARKET", path: "/marketplace" },
  { label: "SELL / LIST", path: "/seller/create" },
  { label: "ESCROW", path: "/escrow" },
  { label: "COMM", path: "/comm" },
];

export default function SystemsRail() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="h-full px-4 py-6 font-mono text-sm space-y-3">
      {SYSTEMS.map((sys) => {
        const active = pathname.startsWith(sys.path);
        return (
          <button
            key={sys.label}
            onClick={() => router.push(sys.path)}
            className={`w-full border px-3 py-2 text-left tracking-widest transition ${
              active
                ? "border-green-400 text-green-400"
                : "border-gray-700 text-gray-400 hover:border-gray-500"
            }`}
          >
            {sys.label}
          </button>
        );
      })}
    </nav>
  );
}
