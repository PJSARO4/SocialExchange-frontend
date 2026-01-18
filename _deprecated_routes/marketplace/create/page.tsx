"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function CreateListingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("");
  const [followers, setFollowers] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  // ---------------------------------------------------------------------------
  // Route protection
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 text-sm">
          Loading…
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Submit handler (stub)
  // ---------------------------------------------------------------------------
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    alert("Listing submitted (stub)");

    // Later this will POST to backend
    router.push("/marketplace");
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white border rounded-xl p-6">
        <h1 className="text-3xl font-bold mb-2">
          Create Listing
        </h1>

        <p className="text-gray-600 mb-6">
          Add a social media account to the marketplace.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Listing Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-3 border rounded"
          />

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            required
            className="w-full p-3 border rounded"
          >
            <option value="">Select Platform</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="X">X (Twitter)</option>
          </select>

          <input
            type="number"
            placeholder="Follower Count"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            required
            className="w-full p-3 border rounded"
          />

          <input
            type="text"
            placeholder="Price (USD)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full p-3 border rounded"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full p-3 border rounded"
          />

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              className="bg-black text-white px-6 py-3 rounded hover:opacity-90"
            >
              Submit Listing
            </button>

            <button
              type="button"
              onClick={() => router.push("/marketplace")}
              className="border px-6 py-3 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

