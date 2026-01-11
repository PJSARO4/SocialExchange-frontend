"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../app/context/AuthContext";

export default function Header() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="w-full bg-[#070B14] border-b border-[#1f2937]">
      {/* Top status bar */}
      <div className="h-[2px] bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Ship ID */}
        <div className="flex items-center gap-4">
          <span className="text-green-500 text-xs tracking-widest animate-pulse">
            ● SYSTEM ONLINE
          </span>
          <Link
            href="/dashboard"
            className="text-white font-semibold tracking-wide"
          >
            SocialExchange
          </Link>
        </div>

        {/* Center: Navigation */}
        {user && !loading && (
          <nav className="flex gap-8 text-sm text-gray-400">
            <Link href="/dashboard" className="hover:text-green-400">
              Dashboard
            </Link>
            <Link href="/marketplace" className="hover:text-green-400">
              Marketplace
            </Link>
            <Link href="/marketplace/create" className="hover:text-orange-400">
              Sell
            </Link>
          </nav>
        )}

        {/* Right: Pilot Info */}
        {user && !loading && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-400"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
