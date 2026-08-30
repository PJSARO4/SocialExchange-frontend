/**
 * Package builder — images plus a Metricool-ready CSV, zipped for download.
 *
 * Mirrors the desktop app's export format exactly, so a package produced here
 * and a package produced there import identically.
 */

import { buildZip, type ZipEntry } from './zip';

/**
 * Metricool's bulk importer expects a fixed column set and TRUE/FALSE strings.
 * Verify this header against the template Metricool gives you in the importer
 * before a large run — their schema has changed before and will again.
 */
export const METRICOOL_COLUMNS = [
  'Text', 'Date', 'Time', 'Draft',
  'Facebook', 'Instagram', 'Twitter', 'LinkedIn',
  'Pinterest', 'TikTok', 'Youtube', 'GMB', 'Threads', 'Bluesky',
  'Image URL',
] as const;

const NETWORK_COLUMN: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  tiktok: 'TikTok',
  youtube: 'Youtube',
  gmb: 'GMB',
  threads: 'Threads',
  bluesky: 'Bluesky',
};

export const NETWORK_KEYS = Object.keys(NETWORK_COLUMN);

export interface PackageItem {
  blob: Blob;
  mode: string;
  modeLabel: string;
  template: string;
  templateName: string;
  top: string;
  bottom: string;
}

export interface PackageOptions {
  keyword: string;
  networks: string[];
  startsInHours: number;
  intervalHours: number;
  draft: boolean;
  mediaBaseUrl: string;
}

export function slugify(text: string, maxLen = 40): string {
  const s = (text || 'meme')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return (s || 'meme').slice(0, maxLen);
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function hm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function blobBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

export interface PackageResult {
  blob: Blob;
  filename: string;
  count: number;
  needsUrls: boolean;
}

export async function buildPackage(
  items: PackageItem[],
  opts: PackageOptions,
): Promise<PackageResult> {
  const now = new Date();
  const stamp =
    `${ymd(now)}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const folder = `memes_${slugify(opts.keyword)}_${stamp}`;

  const base = opts.mediaBaseUrl.trim().replace(/\/+$/, '');
  const start = new Date(now.getTime() + opts.startsInHours * 3600_000);
  start.setMinutes(0, 0, 0);

  const entries: ZipEntry[] = [];
  const csvRows: string[][] = [METRICOOL_COLUMNS.map(c => c)];
  const manifestRows: string[][] = [[
    'file', 'mode', 'mode_label', 'template',
    'top_text', 'bottom_text', 'keyword', 'scheduled',
  ]];

  const encoder = new TextEncoder();

  for (let i = 0; i < items.length; i++) {
    const item = items[i] as PackageItem;
    const when = new Date(start.getTime() + opts.intervalHours * 3600_000 * i);
    const name =
      `${pad(i + 1)}_${slugify(item.mode, 20)}_${slugify(opts.keyword, 24)}.png`;

    entries.push({
      name: `${folder}/media/${name}`,
      data: await blobBytes(item.blob),
    });

    const caption = `${item.top} ${item.bottom}`.trim() || opts.keyword;
    const row: string[] = METRICOOL_COLUMNS.map(col => {
      switch (col) {
        case 'Text': return caption;
        case 'Date': return ymd(when);
        case 'Time': return hm(when);
        case 'Draft': return opts.draft ? 'TRUE' : 'FALSE';
        case 'Image URL': return base ? `${base}/${name}` : '';
        default: {
          const key = Object.keys(NETWORK_COLUMN)
            .find(k => NETWORK_COLUMN[k] === col);
          if (!key) return '';
          return opts.networks.includes(key) ? 'TRUE' : 'FALSE';
        }
      }
    });
    csvRows.push(row);

    manifestRows.push([
      name, item.mode, item.modeLabel, item.template,
      item.top, item.bottom, opts.keyword,
      `${ymd(when)} ${hm(when)}`,
    ]);
  }

  const toCsv = (rows: string[][]) =>
    rows.map(r => r.map(csvCell).join(',')).join('\r\n');

  entries.push({
    name: `${folder}/metricool_import.csv`,
    data: encoder.encode(toCsv(csvRows)),
  });
  entries.push({
    name: `${folder}/manifest.csv`,
    data: encoder.encode(toCsv(manifestRows)),
  });
  entries.push({
    name: `${folder}/README.txt`,
    data: encoder.encode(
      'MEMEMaker package (Social Exchange — Meme Lab)\n' +
      `Created: ${ymd(now)} ${hm(now)}\n` +
      `Subject: ${opts.keyword}\n` +
      `Posts:   ${items.length}\n\n` +
      'HOW TO USE\n' +
      '1. Unzip this folder into your synced Google Drive folder.\n' +
      '2. Share the "media" folder so anyone with the link can view it.\n' +
      "3. If the 'Image URL' column is blank, fill it with each file's public\n" +
      '   Drive link. Metricool cannot fetch a link that requires sign-in.\n' +
      '4. In Metricool: Planner -> import -> upload metricool_import.csv.\n' +
      '5. Posts arrive as DRAFTS if Draft=TRUE. Review before publishing.\n\n' +
      "Verify the CSV header against Metricool's own downloadable template\n" +
      'before importing a large batch. Their schema changes occasionally.\n\n' +
      'manifest.csv is for you, not Metricool. Do not upload it.\n',
    ),
  });

  return {
    blob: buildZip(entries, now),
    filename: `${folder}.zip`,
    count: items.length,
    needsUrls: !base,
  };
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
