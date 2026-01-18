'use client';

type Props = {
  feedId: string;
  onClose: () => void;
};

export default function ShareIssuancePanel({ feedId, onClose }: Props) {
  return (
    <div className="share-panel-backdrop">
      <div className="share-panel">
        <h2>Issue Shares</h2>
        <p>Feed ID: {feedId}</p>

        <div className="share-panel-body">
          <p>Share issuance logic will live here.</p>
        </div>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
