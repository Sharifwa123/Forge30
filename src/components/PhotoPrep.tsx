'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { autoCrop, cropH, draw, faceInCrop, fit, maxCropW, PASS_H, PASS_RATIO, PASS_W, type Face, type Rect } from '@/lib/passport';

/**
 * Prepares an uploaded photo as a 35x45 mm passport picture: finds the face, centres it, and lets the student fine-tune before upload.
 * Face detection runs in the browser (lazy-loaded), so the photo never leaves the phone until the student confirms.
 */
type Status = 'loading' | 'finding' | 'found' | 'none' | 'unavailable' | 'unreadable';
const PREV_W = 280, PREV_H = Math.round(PREV_W / PASS_RATIO);

export default function PhotoPrep({ file, warn, onDone }: { file: File; warn?: React.ReactNode; onDone: (blob: Blob | null) => void }) {
  const dlg = useRef<HTMLDialogElement>(null); const cv = useRef<HTMLCanvasElement>(null);
  const img = useRef<ImageBitmap | null>(null); const base = useRef<Rect | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [rect, setRect] = useState<Rect | null>(null); const [face, setFace] = useState<Face | null>(null);
  const [zoom, setZoom] = useState(1); const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number; r: Rect } | null>(null);

  useEffect(() => { dlg.current?.showModal(); }, []);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const bmp = await createImageBitmap(file); if (dead) return;
        img.current = bmp; const r0 = autoCrop(bmp.width, bmp.height, null); base.current = r0; setRect(r0); setStatus('finding');
        // Detect on a downscaled copy so large phone photos stay fast.
        const k = Math.min(1, 640 / Math.max(bmp.width, bmp.height));
        const small = document.createElement('canvas'); small.width = Math.round(bmp.width * k); small.height = Math.round(bmp.height * k);
        small.getContext('2d')!.drawImage(bmp, 0, 0, small.width, small.height);
        let box: Face | null = null;
        try {
          const faceapi = await import('@vladmandic/face-api');
          const tf = (faceapi as any).tf; await tf.setBackend('webgl').catch(() => {}); await tf.ready();
          await faceapi.nets.tinyFaceDetector.loadFromUri('/models/face');
          const all = await faceapi.detectAllFaces(small, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 }));
          const best = all.sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height)[0];
          if (best) box = { x: best.box.x / k, y: best.box.y / k, w: best.box.width / k, h: best.box.height / k };
        } catch { if (!dead) setStatus('unavailable'); return; }
        if (dead) return;
        if (box) { const r = autoCrop(bmp.width, bmp.height, box); base.current = r; setFace(box); setRect(r); setStatus('found'); } else setStatus('none');
      } catch { if (!dead) setStatus('unreadable'); }
    })();
    return () => { dead = true; };
  }, [file]);

  useEffect(() => { const c = cv.current, i = img.current; if (c && i && rect) draw(c.getContext('2d')!, i, rect, PREV_W, PREV_H); }, [rect, status]);

  const onZoom = (z: number) => {
    const b = base.current, i = img.current; if (!b || !i || !rect) return; setZoom(z);
    setRect(fit({ cx: rect.cx, cy: rect.cy, sw: Math.min(b.sw / z, maxCropW(i.width, i.height)) }, i.width, i.height));
  };
  const down = (e: React.PointerEvent) => { if (!rect) return; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, r: rect }; };
  const move = (e: React.PointerEvent) => {
    const d = drag.current, i = img.current; if (!d || !i) return;
    const el = (e.currentTarget as HTMLElement).getBoundingClientRect(); const s = d.r.sw / el.width;
    setRect(fit({ ...d.r, cx: d.r.cx - (e.clientX - d.x) * s, cy: d.r.cy - (e.clientY - d.y) * s }, i.width, i.height));
  };
  const up = () => { drag.current = null; };
  const reset = () => { if (base.current) { setRect(base.current); setZoom(1); } };

  const finish = useCallback(async (ok: boolean) => {
    if (!ok || !rect || !img.current) { dlg.current?.close(); onDone(null); return; }
    setBusy(true);
    const out = document.createElement('canvas'); out.width = PASS_W; out.height = PASS_H; draw(out.getContext('2d')!, img.current, rect, PASS_W, PASS_H);
    const blob = await new Promise<Blob | null>((res) => out.toBlob(res, 'image/jpeg', 0.92));
    dlg.current?.close(); onDone(blob);
  }, [rect, onDone]);

  const f = face && rect ? faceInCrop(face, rect) : null;
  const tip = !f ? '' : f.head < 0.6 ? 'Zoom in a little: your head should fill most of the frame.' : f.head > 0.85 ? 'Zoom out a little so your whole head fits.' : Math.abs(f.cx - 0.5) > 0.08 ? 'Drag the photo so your face sits in the middle.' : 'Looks good. Your face is centred.';
  const msg: Record<Status, string> = {
    loading: 'Opening your photo…', finding: 'Finding your face…', found: tip,
    none: 'We could not find a face. Drag and zoom so your face sits inside the guide, or choose another photo.',
    unavailable: 'Automatic centring is not available on this device. Drag and zoom so your face sits inside the guide.',
    unreadable: 'We could not read that file. Please choose a JPG or PNG photo.',
  };
  const ready = rect && status !== 'unreadable' && status !== 'loading';

  return (
    <dialog ref={dlg} className="sheet prep" aria-labelledby="prep-t" data-status={status}
      data-face={f ? JSON.stringify({ cx: +f.cx.toFixed(3), head: +f.head.toFixed(3), crown: +f.crown.toFixed(3) }) : ''}
      onCancel={(e) => { e.preventDefault(); void finish(false); }}>
      <div className="sheet-bar" />
      <div className="sheet-in">
        <div className="eyebrow" style={{ marginBottom: 8 }}>FORGE30 · SHARIF TECHNOLOGIES</div>
        <h2 id="prep-t">Prepare your passport photo</h2>
        <div className="prep-frame" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{ visibility: ready ? 'visible' : 'hidden' }}>
          <canvas ref={cv} width={PREV_W} height={PREV_H} aria-label="Photo preview" />
          <div className="prep-guide" aria-hidden />
        </div>
        {!ready && status !== 'unreadable' && <p className="prep-wait" role="status">{msg[status]}</p>}
        {ready && (<>
          <p className="prep-msg" role="status" aria-live="polite" data-ok={status === 'found' && tip.startsWith('Looks good')}>{status === 'finding' ? msg.finding : msg[status]}</p>
          <label htmlFor="prep-zoom" className="prep-lab">Zoom</label>
          <input id="prep-zoom" type="range" min={0.6} max={2.5} step={0.02} value={zoom} onChange={(e) => onZoom(+e.target.value)} />
          <button type="button" className="btn btn-line sm" onClick={reset} style={{ marginTop: 6 }}>Reset to automatic</button>
        </>)}
        {status === 'unreadable' && <p className="prep-msg" role="alert">{msg.unreadable}</p>}
        <p className="prep-tips">For the best result use a plain, light background, face the camera, and keep sunglasses and hats off. We centre and tidy your photo automatically; we cannot change its background.</p>
        {warn && <div className="info amber" style={{ marginTop: 12, marginBottom: 0 }}>{warn}</div>}
        <div className="sheet-actions">
          <button type="button" className="btn btn-line" onClick={() => void finish(false)} disabled={busy}>Choose another</button>
          <button type="button" className="btn btn-primary" onClick={() => void finish(true)} disabled={!ready || busy}>{busy ? 'Preparing…' : 'Use this photo'}</button>
        </div>
      </div>
    </dialog>
  );
}
