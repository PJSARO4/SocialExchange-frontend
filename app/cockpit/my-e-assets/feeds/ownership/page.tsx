"use client";

import FeedOwnershipCard from "./components/FeedOwnershipCard";
import "./ownership.css";

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
        <FeedOwnershipCard />
      </div>
    </div>
  );
}
