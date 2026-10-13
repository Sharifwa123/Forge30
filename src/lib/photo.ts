import sharp from 'sharp';

export type PhotoResult = { ok: true; buf: Buffer } | { ok: false; status: number; error: string };

/** Re-encode an uploaded photo: verifies it is a real image, strips EXIF/location data, fixes orientation, evens out lighting and sizes it to a passport picture (35x45 mm at 300 dpi). */
export async function processPhoto(file: unknown): Promise<PhotoResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: false, status: 400, error: 'Choose a photo first.' };
  if (file.size > 8 * 1024 * 1024) return { ok: false, status: 413, error: 'That photo is too large (max 8 MB).' };
  try {
    const img = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 }).rotate();
    const meta = await img.metadata();
    if (!['jpeg', 'png', 'webp'].includes(meta.format || '')) throw new Error('format');
    if ((meta.width || 0) < 200 || (meta.height || 0) < 200) return { ok: false, status: 422, error: 'That photo is too small. Use a clear photo at least 200×200 pixels.' };
    const buf = await img.resize(413, 531, { fit: 'cover', position: 'attention' }).normalise({ lower: 1, upper: 99 }).sharpen({ sigma: 0.6 }).jpeg({ quality: 90 }).toBuffer();
    return { ok: true, buf };
  } catch { return { ok: false, status: 422, error: 'We could not read that file. Use a JPG, PNG or WebP photo.' }; }
}
