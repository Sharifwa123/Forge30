'use client';
import { useEffect, useRef, useState } from 'react';
import { NoticeCard, type NoticeItem } from './Notices';

/** Shows items flagged "popup" once per device (until their content changes). */
export default function NoticePopup({ items }: { items: NoticeItem[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [queue, setQueue] = useState<NoticeItem[]>([]);
  const key = (n: NoticeItem) => 'f30_seen_' + n.id + '_' + n.text.length + '_' + n.title.length + n.style;
  useEffect(() => {
    const unseen = items.filter((n) => { try { return n.popup && !localStorage.getItem(key(n)); } catch { return n.popup; } });
    setQueue(unseen);
  }, [items]);
  useEffect(() => { const d = ref.current; if (d && queue.length && !d.open) d.showModal(); }, [queue]);
  function next() {
    const [cur, ...rest] = queue;
    try { if (cur) localStorage.setItem(key(cur), '1'); } catch { /* ignore */ }
    if (rest.length) setQueue(rest); else { ref.current?.close(); setQueue([]); }
  }
  if (!queue.length) return null;
  return (
    <dialog ref={ref} className="sheet nt-pop" aria-label="Important notice" onCancel={(e) => { e.preventDefault(); next(); }}>
      <NoticeCard n={queue[0]} preview />
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 14 }} onClick={next}>{queue.length > 1 ? `Got it (${queue.length - 1} more)` : 'Got it'}</button>
    </dialog>
  );
}
