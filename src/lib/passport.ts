/** Passport photo geometry: 35 x 45 mm, rendered at 300 dpi. */
export const PASS_W = 413, PASS_H = 531, PASS_RATIO = 35 / 45;
export type Rect = { cx: number; cy: number; sw: number }; // source crop: centre + width (height = width / ratio)
export type Face = { x: number; y: number; w: number; h: number };

export const cropH = (sw: number) => sw / PASS_RATIO;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Largest crop width that still fits inside an image of w x h. */
export const maxCropW = (w: number, h: number) => Math.min(w, h * PASS_RATIO);

/** Keep the crop fully inside the image. */
export function fit(r: Rect, w: number, h: number): Rect {
  const sw = clamp(r.sw, 48, maxCropW(w, h)); const sh = cropH(sw);
  return { sw, cx: clamp(r.cx, sw / 2, w - sw / 2), cy: clamp(r.cy, sh / 2, h - sh / 2) };
}

/**
 * Centre the head. The detector box runs roughly brow-to-chin; the crown sits ~35% of the box above it.
 * Head (crown to chin) fills ~72% of the frame height with the crown ~10% below the top edge: the usual passport rule (70-80%).
 */
export function autoCrop(w: number, h: number, face: Face | null): Rect {
  if (!face) return fit({ cx: w / 2, cy: h / 2, sw: maxCropW(w, h) }, w, h);
  const sh = face.h * 1.9; const sw = sh * PASS_RATIO;
  const crown = face.y - 0.35 * face.h;
  return fit({ cx: face.x + face.w / 2, cy: crown - 0.1 * sh + sh / 2, sw }, w, h);
}

/** Where the face sits inside a crop, as fractions (0..1) of the output frame. Used for guidance and tests. */
export function faceInCrop(face: Face, r: Rect) {
  const sh = cropH(r.sw); const left = r.cx - r.sw / 2; const top = r.cy - sh / 2;
  return { cx: (face.x + face.w / 2 - left) / r.sw, head: (face.h * 1.37) / sh, crown: (face.y - 0.35 * face.h - top) / sh };
}

export function draw(ctx: CanvasRenderingContext2D, img: CanvasImageSource, r: Rect, W: number, H: number) {
  const sh = cropH(r.sw);
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, r.cx - r.sw / 2, r.cy - sh / 2, r.sw, sh, 0, 0, W, H);
}
