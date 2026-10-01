'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

/** Branded, accessible replacement for window.confirm / window.prompt. Uses the native <dialog> element for focus trapping, Esc and focus restore. */
export type ConfirmOpts = { title: string; body?: React.ReactNode; confirmLabel?: string; cancelLabel?: string; tone?: 'default' | 'danger'; checkbox?: { label: string; checked?: boolean } };
export type AskOpts = ConfirmOpts & { label: string; placeholder?: string; hint?: string; minLength?: number };

type Req = { kind: 'confirm'; o: ConfirmOpts; done: (v: boolean, checked: boolean) => void } | { kind: 'ask'; o: AskOpts; done: (v: string | null) => void };
const Ctx = createContext<{ confirm: (o: ConfirmOpts) => Promise<boolean>; confirmWith: (o: ConfirmOpts) => Promise<{ ok: boolean; checked: boolean }>; ask: (o: AskOpts) => Promise<string | null> } | null>(null);

export function useDialog() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useDialog must be used inside <DialogProvider>');
  return c;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [req, setReq] = useState<Req | null>(null);
  const confirmWith = useCallback((o: ConfirmOpts) => new Promise<{ ok: boolean; checked: boolean }>((resolve) => setReq({ kind: 'confirm', o, done: (ok, checked) => resolve({ ok, checked }) })), []);
  const confirm = useCallback(async (o: ConfirmOpts) => (await confirmWith(o)).ok, [confirmWith]);
  const ask = useCallback((o: AskOpts) => new Promise<string | null>((done) => setReq({ kind: 'ask', o, done })), []);
  return <Ctx.Provider value={{ confirm, confirmWith, ask }}>{children}{req && <Sheet req={req} close={() => setReq(null)} />}</Ctx.Provider>;
}

function Sheet({ req, close }: { req: Req; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [val, setVal] = useState(''); const [err, setErr] = useState(''); const [checked, setChecked] = useState(!!(req.o as ConfirmOpts).checkbox?.checked);
  const o = req.o; const danger = o.tone === 'danger';
  const finish = (ok: boolean) => {
    if (req.kind === 'confirm') req.done(ok, checked);
    else {
      if (!ok) req.done(null);
      else { const t = val.trim(); if (t.length < ((o as AskOpts).minLength ?? 1)) { setErr('Please fill this in.'); return; } req.done(t); }
    }
    ref.current?.close(); close();
  };
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="sheet-t" aria-describedby="sheet-b"
      onCancel={(e) => { e.preventDefault(); finish(false); }}
      onClick={(e) => { if (e.target === ref.current) finish(false); }}>
      <form method="dialog" onSubmit={(e) => { e.preventDefault(); finish(true); }} noValidate>
        <div className="sheet-bar" data-tone={danger ? 'danger' : 'default'} />
        <div className="sheet-in">
          <div className="eyebrow" style={{ marginBottom: 8 }}>FORGE30 · SHARIF TECHNOLOGIES</div>
          <h2 id="sheet-t">{o.title}</h2>
          <div id="sheet-b" className="sheet-body">{o.body}</div>
          {req.kind === 'confirm' && o.checkbox && (
            <label className="opt cb" style={{ marginTop: 14 }}><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /><span className="mk" aria-hidden /><span>{o.checkbox.label}</span></label>
          )}
          {req.kind === 'ask' && (
            <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
              <label htmlFor="sheet-input">{(o as AskOpts).label}</label>
              {(o as AskOpts).hint && <div className="hint">{(o as AskOpts).hint}</div>}
              <input id="sheet-input" type="text" autoFocus autoComplete="off" placeholder={(o as AskOpts).placeholder} value={val} onChange={(e) => { setVal(e.target.value); setErr(''); }} maxLength={120} />
              {err && <div className="error" role="alert">⚠ {err}</div>}
            </div>
          )}
          <div className="sheet-actions">
            <button type="button" className="btn btn-line" onClick={() => finish(false)} autoFocus={req.kind === 'confirm' && danger}>{o.cancelLabel ?? 'Cancel'}</button>
            <button type="submit" className={'btn ' + (danger ? 'btn-danger' : 'btn-primary')} autoFocus={req.kind === 'confirm' && !danger}>{o.confirmLabel ?? 'Confirm'}</button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
