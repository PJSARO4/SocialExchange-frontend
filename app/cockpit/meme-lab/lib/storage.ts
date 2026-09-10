/**
 * Content Lab -> external storage boundary.
 *
 * This module is the ONLY place Meme Lab knows anything about saving content
 * outside the browser. The UI passes provider-neutral candidates and gets a
 * provider-neutral outcome back; which provider is used, and how it is reached,
 * lives behind saveCandidates().
 *
 * V1 implements Google Drive only. When Social Exchange E-Storage arrives, the
 * change is confined to this file plus the route it calls — the Meme Lab UI,
 * the render pipeline and the export pipeline do not move.
 *
 * ---------------------------------------------------------------------------
 * FILENAME ENCODING IS A COMPATIBILITY BRIDGE, NOT THE METADATA ARCHITECTURE.
 *
 * The existing publishing pipeline derives an Instagram caption from the Drive
 * FILE NAME (bulk-schedule -> generateCaption({ mode: 'filename' }) ->
 * prettifyName()). So the joke text is encoded into the filename purely so that
 * content saved today still captions correctly if it is scheduled tomorrow.
 *
 * The real metadata is written alongside it as Drive appProperties, which
 * survives the round trip and can be read back later without any schema
 * change. When Social Exchange grows a proper content-metadata store, the
 * filename encoding can be dropped without touching either mechanism's
 * consumers.
 * ------------------------------------------------------------------------- */

import { blobToJpeg } from './toJpeg';

export type StorageProvider = 'google-drive';

/** A generated candidate offered up for storage. Provider-neutral. */
export interface SaveCandidate {
  blob: Blob; // PNG, exactly as generated
  subject: string;
  topText: string;
  bottomText: string;
  mode: string;
  modeLabel: string;
  template: string;
  templateName: string;
}

export interface StorageFolder {
  id: string;
  name: string;
}

export interface SaveFileResult {
  filename: string;
  ok: boolean;
  storageFileId?: string;
  webViewLink?: string;
  error?: string;
}

export interface SaveOutcome {
  provider: StorageProvider;
  folderId: string;
  saved: number;
  failed: number;
  results: SaveFileResult[];
}

/**
 * Structured content metadata. Mirrors the fields Social Exchange content will
 * eventually carry in its own store; today it rides along on the stored file.
 */
export interface ContentMeta {
  contentId: string;
  subject: string;
  topText: string;
  bottomText: string;
  caption: string;
  template: string;
  mode: string;
  source: string;
  createdAt: string;
  rightsStatus: string;
}

/** Vercel caps a serverless request body at ~4.5MB; stay well under it. */
const MAX_REQUEST_BYTES = 3_400_000;
const MAX_FILES_PER_REQUEST = 12;

function slug(text: string, maxLen: number): string {
  const s = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.slice(0, maxLen).replace(/-+$/, '');
}

/**
 * Build the storage filename. Drive allows duplicate names within a folder and
 * identifies files by id, so no uniquifying suffix is added — it would leak
 * into the generated caption via prettifyName().
 */
export function storageFilename(c: SaveCandidate): string {
  const joke = `${c.topText} ${c.bottomText}`.trim();
  const basis = slug(joke, 80) || slug(c.subject, 40) || 'meme';
  return `${basis}.jpg`;
}

export function buildMeta(c: SaveCandidate): ContentMeta {
  const caption = `${c.topText} ${c.bottomText}`.trim() || c.subject;
  return {
    contentId:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `ml-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    subject: c.subject,
    topText: c.topText,
    bottomText: c.bottomText,
    caption,
    template: c.template,
    mode: c.mode,
    source: 'meme-lab',
    createdAt: new Date().toISOString(),
    rightsStatus: 'template-derived',
  };
}

interface Prepared {
  filename: string;
  jpeg: Blob;
  meta: ContentMeta;
}

/**
 * Convert candidates to JPEG and save them into the chosen folder.
 * Requests are chunked so a large selection never exceeds the request body cap;
 * per-file results from every chunk are merged into one outcome.
 */
export async function saveCandidates(
  candidates: SaveCandidate[],
  folder: StorageFolder,
  opts: {
    provider?: StorageProvider;
    onProgress?: (done: number, total: number, stage: 'converting' | 'uploading') => void;
  } = {}
): Promise<SaveOutcome> {
  const provider = opts.provider ?? 'google-drive';
  const total = candidates.length;

  // 1) re-encode to JPEG (client-side, free)
  const prepared: Prepared[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i] as SaveCandidate;
    prepared.push({
      filename: storageFilename(c),
      jpeg: await blobToJpeg(c.blob),
      meta: buildMeta(c),
    });
    opts.onProgress?.(i + 1, total, 'converting');
  }

  // 2) chunk by cumulative size and count
  const chunks: Prepared[][] = [];
  let current: Prepared[] = [];
  let currentBytes = 0;
  for (const p of prepared) {
    const tooMany = current.length >= MAX_FILES_PER_REQUEST;
    const tooBig = current.length > 0 && currentBytes + p.jpeg.size > MAX_REQUEST_BYTES;
    if (tooMany || tooBig) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(p);
    currentBytes += p.jpeg.size;
  }
  if (current.length) chunks.push(current);

  // 3) upload
  const results: SaveFileResult[] = [];
  let done = 0;

  for (const chunk of chunks) {
    const fd = new FormData();
    fd.append('provider', provider);
    fd.append('folderId', folder.id);
    for (const p of chunk) {
      fd.append('files', new File([p.jpeg], p.filename, { type: 'image/jpeg' }));
      fd.append('meta', JSON.stringify(p.meta));
    }

    try {
      const res = await fetch('/api/meme-lab/to-drive', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message: string = data?.error || `Save failed (${res.status})`;
        const err = new Error(message) as Error & { notConnected?: boolean };
        if (res.status === 403 && data?.driveConnected === false) err.notConnected = true;
        // A whole-chunk failure is reported per file so the tally stays honest.
        if (res.status === 401 || res.status === 403) throw err;
        for (const p of chunk) results.push({ filename: p.filename, ok: false, error: message });
      } else if (Array.isArray(data?.results)) {
        results.push(...(data.results as SaveFileResult[]));
      } else {
        for (const p of chunk) {
          results.push({ filename: p.filename, ok: false, error: 'Malformed response' });
        }
      }
    } catch (e) {
      if ((e as { notConnected?: boolean })?.notConnected) throw e;
      const message = e instanceof Error ? e.message : 'Network error';
      for (const p of chunk) results.push({ filename: p.filename, ok: false, error: message });
    }

    done += chunk.length;
    opts.onProgress?.(done, total, 'uploading');
  }

  return {
    provider,
    folderId: folder.id,
    saved: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results,
  };
}
