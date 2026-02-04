'use client';

import { useState } from 'react';
import { useFeeds } from '../../context/FeedsContext';
import FeedCard from './FeedCard';
import AddFeedModal from './AddFeedModal';
import { CreateFeedPayload } from '../../types/feed';

export default function FeedsList() {
  const {
    feeds,
    selectedFeedId,
    selectFeed,
    addFeed,
    removeFeed,
    feedsLoading,
  } = useFeeds();

  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const handleAddFeed = async (payload: CreateFeedPayload) => {
    const newFeed = await addFeed(payload);
    selectFeed(newFeed.id);
  };

  const handleRemoveFeed = async (id: string) => {
    if (confirmRemoveId === id) {
      await removeFeed(id);
      setConfirmRemoveId(null);
    } else {
      setConfirmRemoveId(id);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setConfirmRemoveId(null), 3000);
    }
  };

  return (
    <div className="feeds-list-container">
      {/* Header */}
      <div className="feeds-list-header">
        <h2 className="feeds-list-title">CONNECTED ACCOUNTS</h2>
        <button
          className="feeds-list-add-btn"
          onClick={() => setShowAddModal(true)}
          disabled={feedsLoading}
          title="Add account"
        >
          +
        </button>
      </div>

      {/* Feeds List */}
      <div className="feeds-list">
        {feeds.length === 0 ? (
          <div className="feeds-list-empty">
            <div className="feeds-list-empty-icon">📡</div>
            <div className="feeds-list-empty-title">NO ACCOUNTS</div>
            <div className="feeds-list-empty-text">
              Connect your first social account to get started
            </div>
            <button
              className="feeds-list-empty-btn"
              onClick={() => setShowAddModal(true)}
            >
              + ADD ACCOUNT
            </button>
          </div>
        ) : (
          <>
            {feeds.map((feed) => (
              <FeedCard
                key={feed.id}
                feed={feed}
                selected={feed.id === selectedFeedId}
                onSelect={() => selectFeed(feed.id)}
                onRemove={() => handleRemoveFeed(feed.id)}
              />
            ))}
          </>
        )}
      </div>

      {/* Stats Footer */}
      {feeds.length > 0 && (
        <div className="feeds-list-footer">
          <span className="feeds-list-stat">
            {feeds.length} ACCOUNT{feeds.length !== 1 ? 'S' : ''}
          </span>
          <span className="feeds-list-separator">•</span>
          <span className="feeds-list-stat">
            {feeds.filter(f => f.automationEnabled).length} AUTOMATED
          </span>
        </div>
      )}

      {/* Confirm Remove Toast */}
      {confirmRemoveId && (
        <div className="feeds-confirm-toast">
          <span>Click again to confirm removal</span>
          <button onClick={() => setConfirmRemoveId(null)}>Cancel</button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddFeedModal
          onAdd={handleAddFeed}
          onClose={() => setShowAddModal(false)}
          isLoading={feedsLoading}
        />
      )}
    </div>
  );
}
