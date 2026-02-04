"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "DASHBOARD", href: "/dashboard" },
  { label: "MARKET", href: "/exchange" },
  { label: "SELL / LIST", href: "/sell" },
  { label: "ESCROW", href: "/escrow" },
  { label: "COMM", href: "/comm" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-black border-r border-neutral-800 p-4">
      <div className="text-xs text-green-400 mb-4">● SYSTEM ONLINE</div>

      <nav className="space-y-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 text-sm tracking-widest border ${
                active
                  ? "border-green-400 text-green-400"
                  : "border-neutral-700 text-neutral-400 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 text-xs text-neutral-500">
        SIGNAL BUS: NO ACTIVE EVENTS
      </div>
    </aside>
  );
}
