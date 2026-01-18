"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function SellerListingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
        <p className="text-sm text-gray-500">Loading your listings…</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // Stub data (replace with API later)
  // ---------------------------------------------------------------------------
  const listings = [
    {
      id: 1,
      title: "Instagram Meme Page",
      platform: "Instagram",
      followers: 125000,
      price: 450,
      status: "Active",
    },
    {
      id: 2,
      title: "TikTok Clip Account",
      platform: "TikTok",
      followers: 89000,
      price: 320,
      status: "Draft",
    },
  ];

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Your Listings</h1>

          <button
            onClick={() => router.push("/marketplace/create")}
            className="bg-black text-white px-5 py-3 rounded hover:opacity-90"
          >
            + New Listing
          </button>
        </div>

        {/* Empty State */}
        {listings.length === 0 && (
          <div className="bg-white border rounded-xl p-10 text-center">
            <p className="text-gray-600 mb-4">
              You haven’t created any listings yet.
            </p>

            <button
              onClick={() => router.push("/marketplace/create")}
              className="bg-black text-white px-5 py-3 rounded hover:opacity-90"
            >
              Create your first listing
            </button>
          </div>
        )}

        {/* Listings Table */}
        {listings.length > 0 && (
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="text-left p-4">Account</th>
                  <th className="text-left p-4">Platform</th>
                  <th className="text-right p-4">Followers</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {listings.map((listing) => (
                  <tr
                    key={listing.id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium">
                      {listing.title}
                    </td>

                    <td className="p-4">
                      {listing.platform}
                    </td>

                    <td className="p-4 text-right">
                      {listing.followers.toLocaleString()}
                    </td>

                    <td className="p-4 text-right">
                      ${listing.price}
                    </td>

                    <td className="p-4 text-center">
                      <span className="px-2 py-1 rounded text-xs bg-gray-200">
                        {listing.status}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-3">
                      <button
                        onClick={() =>
                          router.push(`/marketplace/${listing.id}`)
                        }
                        className="text-black underline"
                      >
                        View
                      </button>

                      <button
                        onClick={() =>
                          router.push(`/marketplace/${listing.id}/edit`)
                        }
                        className="text-gray-600 underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
