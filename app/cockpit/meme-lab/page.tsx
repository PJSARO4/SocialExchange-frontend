'use client';

/**
 * Meme Lab — the MEMEMaker desktop app, ported into the cockpit.
 *
 * Type a subject (or hit Random), get a grid of candidates across seven
 * comedic modes, select the ones you want, export a package: images plus a
 * Metricool-ready CSV, zipped.
 *
 * Everything renders in the browser on <canvas>. No models, no server render,
 * no per-image cost.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import './meme-lab.css';

import { generate, randomSubject, cleanKeyword, type Caption } from './lib/captions';
import { renderMeme } from './lib/render';
import {
  buildPackage, triggerDownload, NETWORK_KEYS, slugify,
  type PackageItem,
} from './lib/exportPackage';

const GRID_SIZE = 12;
const SETTINGS_KEY = 'meme-lab-settings';

interface TemplateSummary {
  id: string;
  name: string;
  lines: number;
}

interface Candidate extends Caption {
  id: string;
  blob: Blob;
  objectUrl: string;
  template: string;
  templateName: string;
}

interface Settings {
  networks: string[];
  intervalHours: number;
  startsInHours: number;
  draft: boolean;
  mediaBaseUrl: string;
}

const DEFAULT_SETTINGS: Settings = {
  networks: ['instagram'],
  intervalHours: 24,
  startsInHours: 24,
  draft: true,
  mediaBaseUrl: '',
};

function shuffled<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

export default function MemeLabPage() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [status, setStatus] = useState('INITIALIZING');
  const [keyword, setKeyword] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [fry, setFry] = useState(0);
  const [results, setResults] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; kind: 'ok' | 'warn' | 'err' } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // object URLs we own and must revoke
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) as Partial<Settings> });
    } catch {
      /* storage unavailable — defaults are fine */
    }
  }, []);

  const persist = useCallback((next: Settings) => {
    setSettings(next);
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/meme-lab/templates');
        const data = (await res.json()) as { templates?: TemplateSummary[]; error?: string };
        if (cancelled) return;
        if (!res.ok || !data.templates?.length) {
          setStatus('TEMPLATE SOURCE UNREACHABLE');
          setNotice({
            text: data.error ?? 'Could not load templates. Check your connection and reload.',
            kind: 'err',
          });
          return;
        }
        setTemplates(data.templates);
        setStatus(`${data.templates.length} TEMPLATES READY`);
      } catch {
        if (!cancelled) setStatus('TEMPLATE SOURCE UNREACHABLE');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // revoke object URLs on unmount
  useEffect(() => {
    const urls = urlsRef.current;
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); };
  }, []);

  const make = useCallback(async (subject?: string) => {
    if (busy) return;
    if (!templates.length) {
      setNotice({ text: 'No templates loaded yet.', kind: 'warn' });
      return;
    }
    const word = cleanKeyword(subject ?? keyword) || randomSubject();
    setKeyword(word);
    setActiveKeyword(word);
    setBusy(true);
    setNotice(null);

    // release the previous batch
    urlsRef.current.forEach(u => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setResults([]);
    setSelected(new Set());

    try {
      const picks = shuffled(templates).slice(0, GRID_SIZE);
      const caps = generate(word, GRID_SIZE);
      const out: Candidate[] = [];

      for (let i = 0; i < Math.min(picks.length, caps.length); i++) {
        const tpl = picks[i] as TemplateSummary;
        const cap = caps[i] as Caption;
        try {
          const r = await renderMeme({
            templateUrl: `/api/meme-lab/image?id=${encodeURIComponent(tpl.id)}`,
            top: cap.top,
            bottom: cap.bottom,
            fry,
          });
          urlsRef.current.push(r.objectUrl);
          out.push({
            ...cap,
            id: `${Date.now()}-${i}`,
            blob: r.blob,
            objectUrl: r.objectUrl,
            template: tpl.id,
            templateName: tpl.name,
          });
          setResults([...out]); // stream them in as they finish
        } catch {
          /* skip a template that failed to load */
        }
      }

      if (!out.length) {
        setNotice({ text: 'Nothing rendered — every template failed to load.', kind: 'err' });
      }
    } finally {
      setBusy(false);
    }
  }, [busy, templates, keyword, fry]);

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exportPackage = useCallback(async () => {
    const chosen = results.filter(r => selected.has(r.id));
    if (!chosen.length) {
      setNotice({ text: 'Select at least one meme first.', kind: 'warn' });
      return;
    }
    setExporting(true);
    try {
      const items: PackageItem[] = chosen.map(c => ({
        blob: c.blob,
        mode: c.mode,
        modeLabel: c.modeLabel,
        template: c.template,
        templateName: c.templateName,
        top: c.top,
        bottom: c.bottom,
      }));
      const pkg = await buildPackage(items, {
        keyword: activeKeyword,
        networks: settings.networks,
        startsInHours: settings.startsInHours,
        intervalHours: settings.intervalHours,
        draft: settings.draft,
        mediaBaseUrl: settings.mediaBaseUrl,
      });
      triggerDownload(pkg.blob, pkg.filename);
      setNotice({
        text: pkg.needsUrls
          ? `${pkg.count} posts exported. The Image URL column is empty — paste public Drive links before importing.`
          : `${pkg.count} posts exported to ${pkg.filename}.`,
        kind: pkg.needsUrls ? 'warn' : 'ok',
      });
    } catch (err) {
      setNotice({
        text: `Export failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        kind: 'err',
      });
    } finally {
      setExporting(false);
    }
  }, [results, selected, activeKeyword, settings]);

  const downloadOne = useCallback(() => {
    const chosen = results.filter(r => selected.has(r.id));
    if (!chosen.length) {
      setNotice({ text: 'Select at least one meme first.', kind: 'warn' });
      return;
    }
    chosen.forEach((c, i) => {
      setTimeout(
        () => triggerDownload(c.blob, `${slugify(activeKeyword)}-${i + 1}.png`),
        i * 220,
      );
    });
  }, [results, selected, activeKeyword]);

  const toggleNetwork = (key: string) => {
    const on = settings.networks.includes(key);
    persist({
      ...settings,
      networks: on
        ? settings.networks.filter(n => n !== key)
        : [...settings.networks, key],
    });
  };

  const selectedCount = selected.size;

  return (
    <div className="meme-lab">
      <div className="ml-inner">
        <div className="ml-statusrow">
          <span className="ml-dot" />
          <span className="ml-label">{status}</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="ml-btn ml-btn-quiet"
            onClick={() => setShowSettings(v => !v)}
          >
            {showSettings ? 'Hide Config' : 'Config'}
          </button>
        </div>

        <h1 className="ml-h1">What would you like to meme today?</h1>
        <p className="ml-sub" style={{ marginTop: '0.6rem' }}>
          <span style={{ color: 'var(--ml-aqua)' }}>// </span>
          Enter a subject, or take whatever the machine gives you.
        </p>

        <div className="ml-controls">
          <input
            className="ml-input"
            placeholder="mondays / printers / my back / the group chat"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void make(); }}
            disabled={busy}
          />
          <button
            type="button"
            className="ml-btn ml-btn-primary"
            onClick={() => void make()}
            disabled={busy || !templates.length}
          >
            {busy ? 'Rendering…' : 'Make Memes'}
          </button>
          <button
            type="button"
            className="ml-btn ml-btn-ghost"
            onClick={() => void make(randomSubject())}
            disabled={busy || !templates.length}
          >
            Random
          </button>
        </div>

        <div className="ml-fryrow">
          <span className="ml-label">Deep Fry</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={fry}
            onChange={e => setFry(Number(e.target.value))}
          />
          <span className="ml-label">{fry.toFixed(1)}</span>
        </div>

        {showSettings && (
          <div className="ml-settings">
            <div className="ml-field">
              <span className="ml-label">Public Media Base URL</span>
              <input
                className="ml-input"
                placeholder="https://drive.google.com/…"
                value={settings.mediaBaseUrl}
                onChange={e => persist({ ...settings, mediaBaseUrl: e.target.value })}
              />
              <p className="ml-hint">
                If blank, the CSV&apos;s Image URL column stays empty and you paste share
                links before importing. Metricool cannot fetch a link that requires sign-in.
              </p>
            </div>

            <div className="ml-field">
              <span className="ml-label">Networks</span>
              <div className="ml-netgrid">
                {NETWORK_KEYS.map(key => (
                  <button
                    type="button"
                    key={key}
                    className={`ml-chip ${settings.networks.includes(key) ? 'on' : ''}`}
                    onClick={() => toggleNetwork(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-row2">
              <div>
                <span className="ml-label">Hours Between Posts</span>
                <input
                  className="ml-input"
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={settings.intervalHours}
                  onChange={e => persist({ ...settings, intervalHours: Number(e.target.value) || 24 })}
                />
              </div>
              <div>
                <span className="ml-label">First Post (h from now)</span>
                <input
                  className="ml-input"
                  type="number"
                  min={0}
                  step={1}
                  value={settings.startsInHours}
                  onChange={e => persist({ ...settings, startsInHours: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <label className="ml-check">
              <input
                type="checkbox"
                checked={settings.draft}
                onChange={e => persist({ ...settings, draft: e.target.checked })}
              />
              Import as drafts (recommended)
            </label>
          </div>
        )}

        {notice && (
          <p
            className={`ml-sub ${notice.kind === 'warn' ? 'ml-warn' : ''} ${notice.kind === 'err' ? 'ml-err' : ''}`}
            style={{ marginTop: '1rem' }}
          >
            {notice.text}
          </p>
        )}

        {results.length === 0 ? (
          <div className="ml-empty">
            {busy ? <div className="ml-spinner" /> : null}
            <span className="ml-label">{busy ? 'Rendering' : 'Awaiting Input'}</span>
            <span className="ml-sub">
              {busy ? 'Compositing candidates…' : 'Enter a subject above and press Make Memes.'}
            </span>
          </div>
        ) : (
          <>
            <div className="ml-gridhead">
              <h2 className="ml-h1" style={{ fontSize: '16px', letterSpacing: '0.2em' }}>
                › {activeKeyword.toUpperCase()}
              </h2>
              <span className="ml-label">{results.length} Candidates</span>
              <span className="ml-label" style={{ color: 'var(--ml-aqua-60)' }}>
                · Click to select
              </span>
            </div>
            <div className="ml-rule" />

            <div className="ml-grid">
              {results.map(r => (
                <button
                  type="button"
                  key={r.id}
                  className={`ml-card ${selected.has(r.id) ? 'selected' : ''}`}
                  onClick={() => toggle(r.id)}
                  aria-pressed={selected.has(r.id)}
                >
                  {selected.has(r.id) && <span className="ml-badge">✓</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.objectUrl} alt={`${r.modeLabel}: ${r.top} ${r.bottom}`} />
                  <div className="ml-meta">
                    <div className="ml-label mode">{r.modeLabel}</div>
                    <div className="tpl">{r.templateName}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="ml-rail">
          <span className="ml-label">
            {selectedCount === 0 ? 'No Selection' : `${selectedCount} Selected`}
          </span>
          <span className="spacer" />
          <button
            type="button"
            className="ml-btn ml-btn-quiet"
            onClick={() => setSelected(new Set())}
            disabled={selectedCount === 0}
          >
            Clear
          </button>
          <button
            type="button"
            className="ml-btn ml-btn-ghost"
            onClick={downloadOne}
            disabled={selectedCount === 0}
          >
            Download PNGs
          </button>
          <button
            type="button"
            className="ml-btn ml-btn-primary"
            onClick={() => void exportPackage()}
            disabled={selectedCount === 0 || exporting}
          >
            {exporting ? 'Packaging…' : 'Create Package + CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
