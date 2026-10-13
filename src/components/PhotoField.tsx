'use client';
import { useEffect, useRef, useState } from 'react';
import PhotoPrep from './PhotoPrep';

/** Take or choose a photo, auto-crop it to a passport picture (via PhotoPrep) and hand the result back. Used in the application and on the dashboard. */
export default function PhotoField({ blob, onBlob, error }: { blob: Blob | null; onBlob: (b: Blob | null) => void; error?: string }) {
  const gallery = useRef<HTMLInputElement>(null); const camera = useRef<HTMLInputElement>(null);
  const [prep, setPrep] = useState<{ file: File; from: React.RefObject<HTMLInputElement | null> } | null>(null);
  const [url, setUrl] = useState('');
  useEffect(() => { if (!blob) { setUrl(''); return; } const u = URL.createObjectURL(blob); setUrl(u); return () => URL.revokeObjectURL(u); }, [blob]);
  const pick = (f: File | undefined, from: React.RefObject<HTMLInputElement | null>) => { if (f) setPrep({ file: f, from }); };
  const done = (b: Blob | null) => { const from = prep?.from; setPrep(null); if (from?.current) from.current.value = ''; if (b) onBlob(b); };
  return (
    <div className={'field' + (error ? ' invalid' : '')} data-field="finish-photo">
      <div className="pf">
        <div className="pf-box">{url ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={url} alt="Your passport photo preview" /> : <span aria-hidden>👤</span>}</div>
        <div className="pf-side">
          <p style={{ margin: '0 0 8px' }}>Use a clear, front-facing photo: plain background, face fully visible, no sunglasses or hat. We centre it as a passport picture for you.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary sm" onClick={() => camera.current?.click()}>{blob ? 'RETAKE PHOTO' : 'TAKE A PHOTO'}</button>
            <button type="button" className="btn btn-line sm" onClick={() => gallery.current?.click()}>CHOOSE FROM GALLERY</button>
          </div>
          <input ref={gallery} id="photo-field-file" type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0], gallery)} />
          <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={(e) => pick(e.target.files?.[0], camera)} />
        </div>
      </div>
      {error && <div className="error" role="alert">⚠ {error}</div>}
      {prep && <PhotoPrep file={prep.file} onDone={done} />}
    </div>
  );
}
