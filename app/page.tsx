"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(
        "https://socialexchangebackend.onrender.com/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.detail || "Authentication failed");
      }

      setSuccess(`Logged in as ${data.user.email}`);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 360,
          padding: 24,
          border: "1px solid #333",
          borderRadius: 8,
        }}
      >
        <h1 style={{ marginBottom: 24 }}>SocialExchange</h1>

        <label>Email</label>
        <input
          style={{ width: "100%", marginBottom: 12 }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <input
          type="password"
          style={{ width: "100%", marginBottom: 16 }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
        )}

        {success && (
          <div style={{ color: "lime", marginBottom: 12 }}>{success}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </main>
  );
}
