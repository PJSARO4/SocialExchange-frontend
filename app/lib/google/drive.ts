/**
 * Google Drive helpers — resolve a valid token from the stored Account row
 * (refreshing if expired), list a folder, download a file into public Blob
 * storage (so Instagram can fetch it), and move a file between folders.
 */
import { prisma } from '@/lib/prisma';
import { refreshGoogleToken } from './oauth';
import { put } from '@vercel/blob';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

/** Get a currently-valid Google access token for this user, refreshing if needed. */
export async function getDriveAccessToken(userId: string): Promise<string> {
  const acct = await prisma.account.findFirst({
    where: { userId, provider: 'google-drive' },
    select: { access_token: true, refresh_token: true, expires_at: true },
  });
  if (!acct?.access_token) throw new Error('Google Drive not connected');

  const now = Math.floor(Date.now() / 1000);
  if (acct.expires_at && acct.expires_at > now + 60) return acct.access_token;
  if (!acct.refresh_token) return acct.access_token; // best effort

  const t = await refreshGoogleToken(acct.refresh_token);
  const expires_at = t.expires_in ? now + t.expires_in : null;
  await prisma.account.updateMany({
    where: { userId, provider: 'google-drive' },
    data: { access_token: t.access_token, expires_at },
  });
  return t.access_token;
}

export interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  size?: string;
  thumbnailLink?: string;
  createdTime?: string;
}

/** List folders + media files inside a folder (or Drive root if none given). */
export async function listDrive(token: string, folderId?: string): Promise<DriveItem[]> {
  const parent = folderId || 'root';
  const q = `'${parent}' in parents and trashed = false`;
  const url =
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}` +
    `&fields=files(id,name,mimeType,size,thumbnailLink,createdTime)` +
    `&orderBy=folder,name&pageSize=200&spaces=drive`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Drive list failed');
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    isFolder: f.mimeType === 'application/vnd.google-apps.folder',
    size: f.size,
    thumbnailLink: f.thumbnailLink,
    createdTime: f.createdTime,
  }));
}

/** Download a Drive file and re-host it on public Blob storage; returns the public URL. */
export async function downloadDriveToBlob(
  token: string,
  fileId: string,
  name: string
): Promise<{ url: string; contentType: string }> {
  const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive download failed (${res.status})`);
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const buf = Buffer.from(await res.arrayBuffer());
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = await put(`drive/${fileId}-${safe}`, buf, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
  });
  return { url: blob.url, contentType };
}

/** Move a file from one folder to another (e.g. to-post -> posted). Needs write scope. */
export async function moveDriveFile(
  token: string,
  fileId: string,
  addParentId: string,
  removeParentId: string
): Promise<void> {
  const url =
    `${DRIVE_API}/files/${fileId}` +
    `?addParents=${addParentId}&removeParents=${removeParentId}&fields=id,parents`;
  const res = await fetch(url, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'Drive move failed');
}
