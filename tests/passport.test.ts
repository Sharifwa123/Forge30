import test from 'node:test';
import assert from 'node:assert/strict';
import { autoCrop, cropH, faceInCrop, fit, maxCropW, PASS_RATIO } from '../src/lib/passport';

test('crop is always passport ratio and inside the image', () => {
  for (const [w, h, face] of [[1086, 1448, { x: 208, y: 572, w: 649, h: 674 }], [1600, 1000, { x: 165, y: 451, w: 350, h: 303 }], [800, 800, null], [3000, 4000, { x: 10, y: 10, w: 100, h: 100 }]] as const) {
    const r = autoCrop(w, h, face); const sh = cropH(r.sw);
    assert.ok(Math.abs(r.sw / sh - PASS_RATIO) < 1e-9);
    assert.ok(r.cx - r.sw / 2 >= -1e-6 && r.cx + r.sw / 2 <= w + 1e-6 && r.cy - sh / 2 >= -1e-6 && r.cy + sh / 2 <= h + 1e-6, `${w}x${h} stays inside`);
  }
});
test('a detected face ends up centred with the head ~72% of the frame', () => {
  const face = { x: 208, y: 572, w: 649, h: 674 }; const f = faceInCrop(face, autoCrop(1086, 1448, face));
  assert.ok(Math.abs(f.cx - 0.5) < 0.02, `centred (${f.cx})`); assert.ok(f.head > 0.65 && f.head < 0.8, `head ${f.head}`); assert.ok(f.crown > 0.05 && f.crown < 0.15, `crown ${f.crown}`);
});
test('an off-centre small face is re-centred', () => {
  const face = { x: 165, y: 451, w: 350, h: 303 }; const f = faceInCrop(face, autoCrop(1600, 1000, face));
  assert.ok(Math.abs(f.cx - 0.5) < 0.03, `centred (${f.cx})`);
});
test('no face falls back to the largest centred crop', () => {
  const r = autoCrop(800, 1200, null); assert.equal(r.cx, 400); assert.equal(r.cy, 600); assert.ok(Math.abs(r.sw - maxCropW(800, 1200)) < 1e-9);
});
test('fit clamps panning and zooming', () => {
  const r = fit({ cx: -50, cy: 99999, sw: 99999 }, 1000, 1000); assert.ok(r.sw <= maxCropW(1000, 1000)); assert.ok(r.cx - r.sw / 2 >= 0 && r.cy + cropH(r.sw) / 2 <= 1000);
});
