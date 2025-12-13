"use client";

import { useState } from "react";

type LoginResponse = {
  token: string;
  user: {
    email: string;
  };
};

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LoginResponse | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      setResult(data);
    } catch {
      setError("Unable to reach login service");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 rounded-xl bg-gray-900 border border-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-center">
          SocialExchange
        </h1>

        {!result && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-gray-500"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {result && (
          <div className="mt-6 space-y-3">
            <p className="text-green-400 font-medium">
              Login successful
            </p>
            <div className="text-sm bg-gray-800 p-3 rounded border border-gray-700">
              <p>
                <span className="text-gray-400">Email:</span>{" "}
                {result.user.email}
              </p>
              <p className="break-all">
                <span className="text-gray-400">Token:</span>{" "}
                {result.token}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
