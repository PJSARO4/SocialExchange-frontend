'use client';

/**
 * SAVE TO DRIVE — destination picker + upload progress.
 *
 * Storage only. Nothing here schedules or publishes; the saved file simply
 * becomes a stored source asset that Bulk Schedule can pick up later, on its
 * own, exactly as it picks up anything else already in Drive.
 *
 * Folder browsing reuses the existing GET /api/google/files endpoint — the same
 * one the Bulk Schedule picker calls. No second Drive integration, no changes
 * to the endpoint.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  saveCandidates,
  type SaveCandidate,
  type SaveOutcome,
  type StorageFolder,
} from '../lib/storage';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
}

type Phase =
  | 'loading'
  | 'notConnected'
  | 'browsing'
  | 'uploading'
  | 'done'
  | 'failed';

interface Props {
  candidates: SaveCandidate[];
  onClose: () => void;
  onSaved?: (outcome: SaveOutcome) => void;
}

export default function SaveToDriveModal({ candidates, onClose, onSaved }: Props) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [items, setItems] = useState<DriveItem[]>([]);
  const [crumbs, setCrumbs] = useState<StorageFolder[]>([{ id: 'root', name: 'My Drive' }]);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0, stage: 'converting' as 'converting' | 'uploading' });
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);

  const here = crumbs[crumbs.length - 1] as StorageFolder;

  const loadFolder = useCallback(async (folderId: string) => {
    setPhase('loading');
    setError('');
    try {
      const res = await fetch(`/api/google/files?folderId=${encodeURIComponent(folderId)}`);
      const data = await res.json();
      if (res.status === 403) {
        setPhase('notConnected');
        return;
      }
      if (!res.ok) throw new Error(data?.error || 'Could not read Drive');
      setItems((data.items || []) as DriveItem[]);
      setPhase('browsing');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read Drive');
      setPhase('failed');
    }
  }, []);

  useEffect(() => { void loadFolder('root'); }, [loadFolder]);

  const openFolder = (item: DriveItem) => {
    setCrumbs(c => [...c, { id: item.id, name: item.name }]);
    void loadFolder(item.id);
  };

  const goCrumb = (idx: number) => {
    const next = crumbs.slice(0, idx + 1);
    setCrumbs(next);
    void loadFolder((next[next.length - 1] as StorageFolder).id);
  };

  const save = async () => {
    setPhase('uploading');
    setError('');
    setProgress({ done: 0, total: candidates.length, stage: 'converting' });
    try {
      const result = await saveCandidates(candidates, here, {
        onProgress: (done, total, stage) => setProgress({ done, total, stage }),
      });
      setOutcome(result);
      setPhase('done');
      onSaved?.(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      if (/not connected/i.test(message)) {
        setPhase('notConnected');
        return;
      }
      setError(message);
      setPhase('failed');
    }
  };

  const folders = items.filter(i => i.isFolder);
  const fileCount = items.length - folders.length;

  return (
    <div className="ml-modal-scrim" onClick={onClose}>
      <div className="ml-modal" onClick={e => e.stopPropagation()}>
        <div className="ml-modal-head">
          <div>
            <div className="ml-modal-title">Save to Drive</div>
            <div className="ml-sub">
              Storage only — this does not schedule or publish.
            </div>
          </div>
          <button type="button" className="ml-btn ml-btn-quiet" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="ml-modal-body">
          {phase === 'notConnected' && (
            <div className="ml-modal-state">
              <div className="ml-label ml-warn">Drive Not Connected</div>
              <p className="ml-hint">
                Social Exchange needs access to your Google Drive before it can store
                content there.
              </p>
              <a className="ml-btn ml-btn-ghost ml-linkbtn" href="/api/google/start">
                Connect Google Drive
              </a>
            </div>
          )}

          {phase === 'failed' && (
            <div className="ml-modal-state">
              <div className="ml-label ml-err">Failed</div>
              <p className="ml-hint">{error}</p>
              <button
                type="button"
                className="ml-btn ml-btn-ghost"
                onClick={() => void loadFolder(here.id)}
              >
                Retry
              </button>
            </div>
          )}

          {phase === 'uploading' && (
            <div className="ml-modal-state">
              <div className="ml-spinner" />
              <div className="ml-label">
                {progress.stage === 'converting' ? 'Converting to JPEG' : 'Uploading to Drive'}
              </div>
              <p className="ml-hint">
                {progress.done} of {progress.total} · destination {here.name}
              </p>
            </div>
          )}

          {phase === 'done' && outcome && (
            <div className="ml-modal-state">
              <div
                className={`ml-label ${outcome.failed === 0 ? '' : outcome.saved === 0 ? 'ml-err' : 'ml-warn'}`}
              >
                {outcome.failed === 0
                  ? 'Saved'
                  : outcome.saved === 0
                    ? 'Failure'
                    : 'Partial Failure'}
              </div>
              <p className="ml-tally">
                {candidates.length} selected · {outcome.saved} saved to Drive
                {outcome.failed > 0 ? ` · ${outcome.failed} failed` : ''}
              </p>
              <p className="ml-hint">
                Stored in <b>{here.name}</b>. Bulk Schedule can pick these up whenever
                you choose to schedule them.
              </p>
              <div className="ml-resultlist">
                {outcome.results.map((r, i) => (
                  <div key={`${r.filename}-${i}`} className="ml-resultrow">
                    <span className={r.ok ? 'ok' : 'bad'}>{r.ok ? '✓' : '✕'}</span>
                    <span className="name">{r.filename}</span>
                    {!r.ok && <span className="why">{r.error}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(phase === 'loading' || phase === 'browsing') && (
            <>
              <div className="ml-label">Destination Folder</div>
              <div className="ml-crumbs">
                {crumbs.map((c, i) => (
                  <span key={`${c.id}-${i}`}>
                    {i > 0 && <span className="sep">/</span>}
                    <button type="button" onClick={() => goCrumb(i)}>{c.name}</button>
                  </span>
                ))}
              </div>

              <div className="ml-folderlist">
                {phase === 'loading' && <div className="ml-spinner" />}
                {phase === 'browsing' && folders.length === 0 && (
                  <p className="ml-hint">No sub-folders here. Save into this folder.</p>
                )}
                {phase === 'browsing' &&
                  folders.map(f => (
                    <button
                      type="button"
                      key={f.id}
                      className="ml-folderrow"
                      onClick={() => openFolder(f)}
                    >
                      <span className="ico">▸</span>
                      <span className="name">{f.name}</span>
                    </button>
                  ))}
              </div>

              {phase === 'browsing' && (
                <p className="ml-hint">
                  {fileCount} file{fileCount === 1 ? '' : 's'} already in {here.name}
                </p>
              )}
            </>
          )}
        </div>

        <div className="ml-modal-foot">
          <span className="ml-label">
            {phase === 'done'
              ? `${outcome?.saved ?? 0} Saved`
              : `${candidates.length} Selected`}
          </span>
          <span className="spacer" />
          {phase === 'done' ? (
            <button type="button" className="ml-btn ml-btn-primary" onClick={onClose}>
              Done
            </button>
          ) : (
            <button
              type="button"
              className="ml-btn ml-btn-primary"
              onClick={() => void save()}
              disabled={phase !== 'browsing' || candidates.length === 0}
            >
              {phase === 'uploading' ? 'Saving…' : `Save Here`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
