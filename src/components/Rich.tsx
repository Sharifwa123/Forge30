import type { ReactNode } from 'react';

/** Tiny, safe formatter for notices: **bold**, *italic*, [link](https://…), "- " bullets, blank line = new paragraph. No raw HTML is ever rendered. */
const SAFE = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i;
export const safeUrl = (u: string) => SAFE.test(u.trim());

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []; const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g; let last = 0; let i = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}-b${i++}`}>{m[1]}</strong>);
    else if (m[2]) out.push(<em key={`${key}-i${i++}`}>{m[2]}</em>);
    else if (safeUrl(m[4])) out.push(<a key={`${key}-a${i++}`} href={m[4]} target={/^https?:/i.test(m[4]) ? '_blank' : undefined} rel="noopener noreferrer">{m[3]}</a>);
    else out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Rich({ text }: { text: string }) {
  const blocks: ReactNode[] = []; let para: string[] = []; let list: string[] = [];
  const flushP = () => { if (para.length) { const k = blocks.length; blocks.push(<p key={k}>{para.flatMap((l, j) => (j ? [<br key={`br${j}`} />, ...inline(l, `${k}-${j}`)] : inline(l, `${k}-${j}`)))}</p>); para = []; } };
  const flushL = () => { if (list.length) { const k = blocks.length; blocks.push(<ul key={k}>{list.map((l, j) => <li key={j}>{inline(l, `${k}-${j}`)}</li>)}</ul>); list = []; } };
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trimEnd(); const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    if (bullet) { flushP(); list.push(bullet[1]); } else if (!line.trim()) { flushP(); flushL(); } else { flushL(); para.push(line); }
  }
  flushP(); flushL();
  return <div className="rich">{blocks}</div>;
}
