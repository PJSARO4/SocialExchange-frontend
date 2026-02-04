"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      router.push("/setup");
    } catch {
      setError("AUTHENTICATION FAILED");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-gray-200 font-mono">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md border border-gray-800 p-8 space-y-6"
      >
        <div className="text-sm tracking-widest text-gray-400">
          MISSION CONTROL ACCESS
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
          />

          <input
            type="password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>

        {error && (
          <div className="text-xs text-red-400 tracking-widest">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full border border-blue-400 text-blue-400 py-3 text-sm tracking-widest hover:border-green-400 hover:text-green-400 transition"
        >
          AUTHENTICATE
        </button>
      </form>
    </div>
  );
}
