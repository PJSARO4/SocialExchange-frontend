"use client";

import Link from "next/link";
import { useAuth } from "../app/context/AuthContext";

export default function NavHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: Logo / Brand */}
        <Link
          href="/dashboard"
          className="text-xl font-bold text-black"
        >
          SocialExchange
        </Link>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                {user.email}
              </span>

              <button
                onClick={logout}
                className="text-sm text-red-600 hover:underline"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-700 hover:underline"
              >
                Log in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
