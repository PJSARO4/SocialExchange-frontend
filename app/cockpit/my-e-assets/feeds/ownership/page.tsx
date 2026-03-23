"use client";

import FeedOwnershipCard, { type FeedOwnership } from "./components/FeedOwnershipCard";
import "./ownership.css";

const mockFeed: FeedOwnership = {
  id: "feed-1",
  platform: "Instagram",
  handle: "example_account",
  equityOwned: 100,
  valuation: 50000,
  monthlyRevenue: 2500,
  status: "ACTIVE",
};

export default function FeedOwnershipPage() {
  return (
    <div className="ownership-root">
      <div className="ownership-header">
        <h1 className="ownership-title">Feed Ownership</h1>
        <p className="ownership-subtitle">
          Manage ownership, shares, and escrow status for your feeds.
        </p>
      </div>

      <div className="ownership-grid">
        <FeedOwnershipCard feed={mockFeed} />
      </div>
    </div>
  );
}
