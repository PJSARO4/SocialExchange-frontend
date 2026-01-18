'use client';

interface Props {
  feedId: string;
  onClose: () => void;
}

export default function ShareIssuancePanel({ feedId, onClose }: Props) {
  return (
    <div className="share-issuance-overlay">
      <div className="share-issuance-panel">
        <h2>Issue Shares</h2>
        <p>Feed ID: {feedId}</p>

        <div className="share-issuance-body">
          <p>This is a placeholder for share issuance logic.</p>
        </div>

        <div className="share-issuance-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
