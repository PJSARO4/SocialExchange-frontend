'use client';

import { Feed } from '../types/feed';

interface Props {
  feed: Feed;
  selected: boolean;
  onSelect: () => void;
}

export default function ConnectedAccountCard({ feed, selected, onSelect }: Props) {
  return (
    <div
      className={`connected-account-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="account-card-header">
        <span className="account-card-platform">{feed.platform}</span>
        <span className={`account-card-status ${feed.isConnected ? 'connected' : 'disconnected'}`}>
          {feed.isConnected ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <div className="account-card-body">
        <div className="account-card-handle">{feed.handle}</div>
        <div className="account-card-name">{feed.displayName}</div>
      </div>

      <div className="account-card-footer">
        <span className="account-card-automation">
          {feed.automationEnabled ? 'ARMED' : 'IDLE'}
        </span>
      </div>
    </div>
  );
}
