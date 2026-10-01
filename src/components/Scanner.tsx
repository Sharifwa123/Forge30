'use client';
import { useEffect, useRef, useState } from 'react';
import { SERIAL_RE } from '@/lib/site';

declare global { interface Window { BarcodeDetector?: any } }

export default function Scanner() {
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'idle' | 'starting' | 'scanning' | 'unsupported' | 'denied'>('idle');
  const [code, setCode] = useState(''); const [err, setErr] = useState('');
  const stream = useRef<MediaStream | null>(null); const stop = useRef(false);

  const go = (text: string) => { const m = SERIAL_RE.exec(text.toUpperCase()); if (!m) return false; stop.current = true; location.href = `/verify/${m[0]}`; return true; };

  async function start() {
    setErr('');
    if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) { setState('unsupported'); return; }
    setState('starting');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      const v = video.current!; v.srcObject = stream.current; await v.play(); setState('scanning');
      const det = new window.BarcodeDetector({ formats: ['qr_code'] }); stop.current = false;
      const tick = async () => {
        if (stop.current) return;
        try { const r = await det.detect(v); for (const b of r) if (go(b.rawValue || '')) return; } catch {}
        setTimeout(tick, 200);
      };
      tick();
    } catch { setState('denied'); }
  }
  useEffect(() => () => { stop.current = true; stream.current?.getTracks().forEach((t) => t.stop()); }, []);

  return (
    <div className="form-card" style={{ transform: 'none' }}>
      <video ref={video} playsInline muted style={{ width: '100%', borderRadius: 12, background: '#000', display: state === 'scanning' ? 'block' : 'none', aspectRatio: '4 / 3', objectFit: 'cover' }} />
      {state !== 'scanning' && <button className="btn btn-primary" style={{ width: '100%' }} onClick={start} disabled={state === 'starting'}>{state === 'starting' ? 'OPENING CAMERA…' : 'OPEN CAMERA AND SCAN'}</button>}
      {state === 'denied' && <div className="info amber" style={{ marginTop: 14 }}><b>Camera not available</b><p style={{ margin: 0 }}>Allow camera access in your browser settings, or enter the serial number below.</p></div>}
      {state === 'unsupported' && <div className="info amber" style={{ marginTop: 14 }}><b>This browser cannot scan inside the page</b><p style={{ margin: 0 }}>Use your phone’s own camera app to scan the QR code (it opens the link), or enter the serial number below.</p></div>}
      <form style={{ marginTop: 22 }} onSubmit={(e) => { e.preventDefault(); if (!go(code)) setErr('Enter the serial exactly as printed, for example ABCD-2345-WXYZ.'); }}>
        <label htmlFor="serial" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Or type the serial number</label>
        <input id="serial" type="text" autoCapitalize="characters" autoComplete="off" placeholder="ABCD-2345-WXYZ" value={code} onChange={(e) => { setCode(e.target.value); setErr(''); }} />
        {err && <div className="error" role="alert">⚠ {err}</div>}
        <button className="btn btn-line" style={{ width: '100%', marginTop: 12 }} disabled={!code.trim()}>VERIFY</button>
      </form>
    </div>
  );
}
