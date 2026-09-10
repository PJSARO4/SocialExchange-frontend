/**
 * PNG -> JPEG re-encode, client-side.
 *
 * This is a separate module rather than a change to render.ts on purpose:
 * DOWNLOAD PNGS and CREATE PACKAGE + CSV must keep emitting the exact PNG bytes
 * they emit today. This is a second, additive encoding applied only on the
 * storage path, where Instagram's pipeline requires JPEG.
 *
 * No new dependency and no server compute — the same technique deepFry()
 * already uses internally.
 */

export const JPEG_QUALITY = 0.92;

/** Decode a blob to something drawable, preferring createImageBitmap. */
async function decode(source: Blob): Promise<{
  draw: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(source);
      return {
        draw: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      /* fall through to the <img> path */
    }
  }

  const url = URL.createObjectURL(source);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not decode image for JPEG conversion'));
      i.src = url;
    });
    return {
      draw: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Re-encode an image blob as JPEG. The source is flattened onto white first —
 * JPEG has no alpha channel, and transparency left unflattened decodes as
 * black.
 */
export async function blobToJpeg(source: Blob, quality = JPEG_QUALITY): Promise<Blob> {
  const { draw, width, height, release } = await decode(source);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(draw, 0, 0, width, height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('JPEG encode returned null'))),
        'image/jpeg',
        quality
      );
    });
  } finally {
    release();
  }
}
