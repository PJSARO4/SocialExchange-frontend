'use client';

import { useEffect, useState } from 'react';

type OpsAsset = {
  id: string;
  name: string;
  description: string;
  price: number;
  status: 'ONLINE' | 'PAUSED';
};

type OwnedAsset = {
  id: string;
  name: string;
  description: string;
  price: number;
  locked?: boolean;
};

const OPS_KEY = 'operations-assets';
const OWNED_KEY = 'owned-assets';

export default function OperationsPage() {
  const [opsAssets, setOpsAssets] = useState<OpsAsset[]>([]);
  const [escrowAssets, setEscrowAssets] = useState<OwnedAsset[]>([]);

  /* -----------------------------------------
     LOAD OPERATIONS ASSETS
  ----------------------------------------- */
  useEffect(() => {
    const raw = localStorage.getItem(OPS_KEY);
    if (raw) setOpsAssets(JSON.parse(raw));
  }, []);

  /* -----------------------------------------
     LOAD ESCROWED OWNED ASSETS
  ----------------------------------------- */
  useEffect(() => {
    const raw = localStorage.getItem(OWNED_KEY);
    if (!raw) return;

    try {
      const owned: OwnedAsset[] = JSON.parse(raw);
      setEscrowAssets(owned.filter((a) => a.locked));
    } catch {
      setEscrowAssets([]);
    }
  }, []);

  function persistOwned(next: OwnedAsset[]) {
    localStorage.setItem(OWNED_KEY, JSON.stringify(next));
    setEscrowAssets(next.filter((a) => a.locked));
  }

  /* -----------------------------------------
     ESCROW RELEASE
  ----------------------------------------- */
  function releaseEscrow(assetId: string) {
    const raw = localStorage.getItem(OWNED_KEY);
    if (!raw) return;

    const owned: OwnedAsset[] = JSON.parse(raw);

    const updated = owned.map((a) =>
      a.id === assetId ? { ...a, locked: false } : a
    );

    persistOwned(updated);
  }

  return (
    <section className="cockpit-panel">
      <header className="panel-header">
        <h1>Operations</h1>
        <p className="panel-subtitle">
          System authority and lifecycle control
        </p>
      </header>

      {/* ESCROW PANEL */}
      <div className="ops-assets">
        <h2 className="ops-section-title">Escrow Queue</h2>

        {escrowAssets.length === 0 ? (
          <p>No assets currently in escrow.</p>
        ) : (
          <ul className="market-feed enhanced">
            {escrowAssets.map((asset) => (
              <li key={asset.id} className="market-row">
                <div className="market-row-main">
                  <div className="asset-block">
                    <span className="asset-name">{asset.name}</span>
                    <span className="asset-description">
                      {asset.description}
                    </span>
                  </div>

                  <div className="price-block">
                    <span className="asset-price">
                      {asset.price.toFixed(2)}
                    </span>
                    <span className="asset-status paused">
                      IN ESCROW
                    </span>
                  </div>
                </div>

                <div className="market-row-footer">
                  <button
                    className="inspect-command"
                    onClick={() => releaseEscrow(asset.id)}
                  >
                    RELEASE ESCROW →
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
