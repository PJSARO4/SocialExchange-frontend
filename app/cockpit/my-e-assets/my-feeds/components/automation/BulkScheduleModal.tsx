'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Folder, Image as ImageIcon, Film, Check, Loader2, CalendarClock, ArrowRight } from 'lucide-react';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  thumbnailLink?: string;
}

interface Props {
  feedId: string;
  feedLabel: string;
  onClose: () => void;
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem',
};
const panel: React.CSSProperties = {
  width: 'min(900px, 100%)', maxHeight: '90vh', overflow: 'auto',
  background: '#0b1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
  color: '#e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
};
const label: React.CSSProperties = { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 };
const input: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#e2e8f0', padding: '0.5rem 0.6rem', fontSize: '0.85rem' };

export default function BulkScheduleModal({ feedId, feedLabel, onClose }: Props) {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [crumbs, setCrumbs] = useState<{ id: string; name: string }[]>([{ id: 'root', name: 'My Drive' }]);
  const [loading, setLoading] = useState(true);
  const [driveError, setDriveError] = useState('');
  const [selected, setSelected] = useState<Record<string, DriveItem>>({});
  // Folder the selected files came from (locked on first pick) — used as move "from".
  const [sourceFolder, setSourceFolder] = useState<{ id: string; name: string } | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(today);
  const [times, setTimes] = useState<string[]>(['09:00', '13:00', '18:00']);
  const [newTime, setNewTime] = useState('12:00');
  const [captionMode, setCaptionMode] = useState<'filename' | 'template' | 'ai'>('filename');
  const [template, setTemplate] = useState('{name} 😂');
  const [hashtags, setHashtags] = useState('memes, funny, viral');

  const [moveEnabled, setMoveEnabled] = useState(false);
  const [postedFolder, setPostedFolder] = useState<{ id: string; name: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  const currentFolder = crumbs[crumbs.length - 1];

  const loadFolder = useCallback(async (folderId: string) => {
    setLoading(true); setDriveError('');
    try {
      const res = await fetch(`/api/google/files?folderId=${encodeURIComponent(folderId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load Drive');
      setItems(data.items || []);
    } catch (e: any) {
      setDriveError(e.message || 'Failed to load Drive');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFolder('root'); }, [loadFolder]);

  const openFolder = (item: DriveItem) => {
    setCrumbs((c) => [...c, { id: item.id, name: item.name }]);
    loadFolder(item.id);
  };
  const goCrumb = (idx: number) => {
    const next = crumbs.slice(0, idx + 1);
    setCrumbs(next);
    loadFolder(next[next.length - 1].id);
  };

  const here = crumbs[crumbs.length - 1];
  const toggleFile = (item: DriveItem) => {
    setSelected((s) => {
      const n = { ...s };
      if (n[item.id]) delete n[item.id]; else n[item.id] = item;
      if (Object.keys(n).length === 0) setSourceFolder(null);
      else if (!sourceFolder) setSourceFolder(here);
      return n;
    });
  };
  const selectAllHere = () => {
    const files = items.filter((i) => !i.isFolder);
    setSelected((s) => {
      const n = { ...s };
      const allSel = files.every((f) => n[f.id]);
      if (allSel) files.forEach((f) => delete n[f.id]);
      else { files.forEach((f) => { n[f.id] = f; }); if (!sourceFolder && files.length) setSourceFolder(here); }
      if (Object.keys(n).length === 0) setSourceFolder(null);
      return n;
    });
  };

  const addTime = () => {
    if (newTime && !times.includes(newTime)) setTimes((t) => [...t, newTime].sort());
  };
  const removeTime = (t: string) => setTimes((x) => x.filter((v) => v !== t));

  const selCount = Object.keys(selected).length;
  const perDay = times.length || 1;
  const daysNeeded = Math.ceil(selCount / perDay);

  const submit = async () => {
    setSubmitting(true); setResult(null);
    try {
      const files = Object.values(selected).map((f) => ({ id: f.id, name: f.name, mimeType: f.mimeType }));
      const body: any = {
        feedId,
        files,
        startDate,
        times,
        tzOffsetMinutes: new Date().getTimezoneOffset(),
        caption: {
          mode: captionMode,
          template: captionMode === 'template' ? template : undefined,
          hashtags: hashtags.split(',').map((h) => h.trim()).filter(Boolean),
        },
      };
      if (moveEnabled && postedFolder && (sourceFolder || currentFolder)) {
        body.move = { fromFolderId: (sourceFolder || currentFolder).id, toFolderId: postedFolder.id };
      }
      const res = await fetch('/api/automation/bulk-schedule', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scheduling failed');
      setResult(data);
      setSelected({});
      // refresh upcoming list
      const up = await fetch(`/api/scheduler?feed_id=${encodeURIComponent(feedId)}&status=pending`).then((r) => r.json()).catch(() => null);
      if (up?.posts) setUpcoming(up.posts.slice(0, 12));
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'sticky', top: 0, background: '#0b1220', zIndex: 2 }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>Bulk Schedule from Drive</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>Posting to <b style={{ color: '#38bdf8' }}>{feedLabel}</b></div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '1.2rem 1.4rem', display: 'grid', gap: '1.3rem' }}>
          {/* Drive picker */}
          <div>
            <div style={label}>1 · Pick content</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: '0.82rem', marginBottom: 8 }}>
              {crumbs.map((c, i) => (
                <span key={c.id + i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {i > 0 && <span style={{ color: 'rgba(255,255,255,0.25)' }}>/</span>}
                  <button onClick={() => goCrumb(i)} style={{ background: 'none', border: 'none', color: i === crumbs.length - 1 ? '#e2e8f0' : '#38bdf8', cursor: 'pointer', padding: 0, fontSize: '0.82rem' }}>{c.name}</button>
                </span>
              ))}
              <button onClick={selectAllHere} style={{ ...input, marginLeft: 'auto', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}>Select all files here</button>
            </div>

            <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, maxHeight: 240, overflow: 'auto' }}>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}><Loader2 size={18} className="spin" /> Loading Drive…</div>
              ) : driveError ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#f87171', fontSize: '0.85rem' }}>
                  {driveError}
                  {/not connected|connect/i.test(driveError) && (
                    <div style={{ marginTop: 8 }}><a href="/api/google/start" style={{ color: '#38bdf8' }}>Connect Google Drive →</a></div>
                  )}
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Empty folder</div>
              ) : (
                items.map((item) => {
                  const isSel = !!selected[item.id];
                  const isVideo = /video\//i.test(item.mimeType);
                  return (
                    <div key={item.id}
                      onClick={() => item.isFolder ? openFolder(item) : toggleFile(item)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.55rem 0.8rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', background: isSel ? 'rgba(56,189,248,0.1)' : 'transparent' }}>
                      <span style={{ color: item.isFolder ? '#f59e0b' : isVideo ? '#a78bfa' : '#38bdf8' }}>
                        {item.isFolder ? <Folder size={16} /> : isVideo ? <Film size={16} /> : <ImageIcon size={16} />}
                      </span>
                      <span style={{ flex: 1, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                      {!item.isFolder && (
                        <span style={{ width: 18, height: 18, borderRadius: 4, border: '1px solid rgba(255,255,255,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: isSel ? '#38bdf8' : 'transparent' }}>
                          {isSel && <Check size={13} color="#0b1220" />}
                        </span>
                      )}
                      {item.isFolder && moveEnabled && (
                        <button onClick={(e) => { e.stopPropagation(); setPostedFolder({ id: item.id, name: item.name }); }}
                          style={{ ...input, padding: '0.15rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer' }}>
                          {postedFolder?.id === item.id ? '✓ Posted' : 'Set Posted'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{selCount} file{selCount === 1 ? '' : 's'} selected</div>
          </div>

          {/* Pattern */}
          <div>
            <div style={label}>2 · Posting pattern</div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ ...label, marginBottom: 4 }}>Start date</span>
                <input type="date" value={startDate} min={today} onChange={(e) => setStartDate(e.target.value)} style={input} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 220 }}>
                <span style={{ ...label, marginBottom: 4 }}>Times each day</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {times.map((t) => (
                    <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 999, padding: '0.2rem 0.55rem', fontSize: '0.78rem' }}>
                      {t}<button onClick={() => removeTime(t)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}>×</button>
                    </span>
                  ))}
                  <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} style={{ ...input, padding: '0.25rem 0.4rem' }} />
                  <button onClick={addTime} style={{ ...input, padding: '0.25rem 0.6rem', cursor: 'pointer' }}>+ Add</button>
                </div>
              </div>
            </div>
            {selCount > 0 && (
              <div style={{ fontSize: '0.78rem', color: '#86efac', marginTop: 8 }}>
                {selCount} posts · {perDay}/day · spanning ~{daysNeeded} day{daysNeeded === 1 ? '' : 's'} from {startDate}
              </div>
            )}
          </div>

          {/* Caption */}
          <div>
            <div style={label}>3 · Captions</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              {(['filename', 'template', 'ai'] as const).map((m) => (
                <button key={m} onClick={() => setCaptionMode(m)}
                  style={{ ...input, cursor: 'pointer', background: captionMode === m ? 'rgba(56,189,248,0.15)' : input.background, borderColor: captionMode === m ? '#38bdf8' : 'rgba(255,255,255,0.12)' }}>
                  {m === 'filename' ? 'From filename' : m === 'template' ? 'Template' : 'AI (Ollama)'}
                </button>
              ))}
            </div>
            {captionMode === 'template' && (
              <input value={template} onChange={(e) => setTemplate(e.target.value)} placeholder="Use {name} for the file name" style={{ ...input, width: '100%', marginBottom: 8 }} />
            )}
            {captionMode === 'ai' && (
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Uses your self-hosted Ollama if reachable; otherwise falls back to a filename caption.</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ ...label, marginBottom: 4 }}>Hashtags (comma-separated)</span>
              <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} style={{ ...input, width: '100%' }} />
            </div>
          </div>

          {/* Move / dedup */}
          <div>
            <div style={label}>4 · Avoid duplicates (optional)</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={moveEnabled} onChange={(e) => setMoveEnabled(e.target.checked)} />
              After posting, move originals out of the source folder into a “posted” folder
            </label>
            {moveEnabled && (
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
                From <b style={{ color: sourceFolder ? '#38bdf8' : '#fbbf24' }}>{sourceFolder ? sourceFolder.name : 'select files first'}</b>
                {' '}→ <b style={{ color: postedFolder ? '#86efac' : '#fbbf24' }}>{postedFolder ? postedFolder.name : 'not set'}</b>
                {!postedFolder && <div style={{ marginTop: 2 }}>Navigate to your “posted” folder above and click <b>Set Posted</b> next to it (your file selection stays locked).</div>}
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
            <button onClick={submit} disabled={submitting || selCount === 0 || times.length === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: selCount ? 'linear-gradient(90deg,#0ea5e9,#6366f1)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: 10, padding: '0.7rem 1.2rem', fontWeight: 700, cursor: selCount && !submitting ? 'pointer' : 'not-allowed', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? <Loader2 size={16} className="spin" /> : <CalendarClock size={16} />}
              Schedule {selCount > 0 ? selCount : ''} post{selCount === 1 ? '' : 's'}
            </button>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>They’ll appear in your Scheduler and auto-post at each time.</span>
          </div>

          {/* Result */}
          {result && (
            <div style={{ border: `1px solid ${result.error ? 'rgba(248,113,113,0.4)' : 'rgba(34,197,94,0.4)'}`, background: result.error ? 'rgba(248,113,113,0.08)' : 'rgba(34,197,94,0.08)', borderRadius: 10, padding: '0.9rem 1.1rem' }}>
              {result.error ? (
                <div style={{ color: '#f87171', fontSize: '0.85rem' }}>{result.error}</div>
              ) : (
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: '#86efac', fontWeight: 700, marginBottom: 4 }}>✓ Scheduled {result.scheduled} post{result.scheduled === 1 ? '' : 's'}{result.failed ? ` · ${result.failed} failed` : ''}</div>
                  {result.firstAt && <div style={{ color: 'rgba(255,255,255,0.6)' }}>First: {new Date(result.firstAt).toLocaleString()} · Last: {new Date(result.lastAt).toLocaleString()}</div>}
                  {result.moved > 0 && <div style={{ color: 'rgba(255,255,255,0.6)' }}>Moved {result.moved} original{result.moved === 1 ? '' : 's'} to posted.</div>}
                  {result.note && <div style={{ color: '#fbbf24', marginTop: 4 }}>{result.note}</div>}
                </div>
              )}
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <div style={label}>Next up in your scheduler</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {upcoming.map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', padding: '0.35rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <ArrowRight size={12} color="#38bdf8" />
                    <span style={{ color: '#e2e8f0' }}>{new Date(p.scheduled_time).toLocaleString()}</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.content?.slice(0, 40) || '(no caption)'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`.spin{animation:spin 0.8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
