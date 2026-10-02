import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { q } from '@/lib/db';
import { cardByRef, readCardToken } from '@/lib/card';
import { rateLimit } from '@/lib/security';
import { siteOrigin } from '@/lib/site';
import { getSettings } from '@/lib/settings';

export const runtime = 'nodejs';
const W = 1012, H = 638; // CR80 (3.375 x 2.125 in) at 300 dpi
const NAVY = '#071230', BRAND = '#1e5ecf', AMBER = '#f6b93b';

const asset = (p: string) => readFile(join(process.cwd(), p));
const dataUri = (b: Buffer, t: string) => `data:${t};base64,${b.toString('base64')}`;

export async function GET(req: Request) {
  const u = new URL(req.url);
  if (!(await rateLimit('card', 60, 600))) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  const ref = readCardToken(u.searchParams.get('t'));
  if (!ref) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  const c = await cardByRef(ref);
  if (!c || c.status !== 'confirmed' || !c.student_id || !c.serial) return NextResponse.json({ error: 'Card not available.' }, { status: 403 });
  const [ph] = await q<{ photo: Buffer | null }>('SELECT photo FROM applications WHERE ref=$1', [ref]);
  if (!ph?.photo) return NextResponse.json({ error: 'Upload your passport photo first.' }, { status: 409 });

  const sideParam = u.searchParams.get('side');
  const side = sideParam === 'back' ? 'back' : sideParam === '3d' ? '3d' : 'front';
  const h = req.headers;
  const origin = siteOrigin(h);
  const s = await getSettings();
  const [logo, logoSm, sans, bold, mono, serif, qr] = await Promise.all([
    asset('public/brand/logo-136.png'), asset('public/brand/logo-84.png'), asset('src/assets/fonts/LiberationSans-Regular.ttf'), asset('src/assets/fonts/LiberationSans-Bold.ttf'),
    asset('src/assets/fonts/LiberationMono-Bold.ttf'), asset('src/assets/fonts/LiberationSerif-Italic.ttf'),
    QRCode.toBuffer(`${origin}/v/${c.serial}`, { margin: 2, width: 560, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }),
  ]);
  const logoUri = dataUri(logo, 'image/png'), logoSmUri = dataUri(logoSm, 'image/png'), qrUri = dataUri(qr, 'image/png');
  const name = c.name.toUpperCase();
  const nameSize = name.length > 28 ? 28 : name.length > 20 ? 34 : 40;
  const issued = c.confirmed_at ? new Date(c.confirmed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '';

  const label = (t: string) => <div style={{ display: 'flex', fontSize: 14, letterSpacing: 3, color: '#8fb0ee', fontWeight: 700 }}>{t}</div>;
  const chip = (k: string, v: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 10, padding: '8px 16px', marginRight: 12 }}>
      {label(k)}<div style={{ display: 'flex', fontSize: 24, fontWeight: 700, marginTop: 2 }}>{v}</div>
    </div>
  );
  const chips = [c.seat && ['SEAT', c.seat], c.group_label && ['GROUP', c.group_label], c.class_code && ['CLASS', c.class_code], ['DATE & TIME', (c.session_time || 'COMING SOON').toUpperCase()]].filter(Boolean) as string[][];

  const front = (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', overflow: 'hidden', color: '#fff', fontFamily: 'Sans', backgroundImage: `linear-gradient(135deg, ${NAVY} 0%, #0a1a3f 55%, #143f93 135%)` }}>
      <div style={{ position: 'absolute', display: 'flex', right: -220, top: -280, width: 640, height: 640, borderRadius: 320, background: 'rgba(30,94,207,0.35)' }} />
      <div style={{ position: 'absolute', display: 'flex', right: -60, top: -120, width: 360, height: 360, borderRadius: 180, border: '2px solid rgba(255,255,255,0.12)' }} />
      <div style={{ position: 'absolute', display: 'flex', left: 0, top: 0, bottom: 0, width: 14, background: AMBER }} />
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '26px 44px 0 58px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUri} width={136} height={136} alt="" style={{ borderRadius: 68 }} />
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 20 }}>
              <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>FORGE<span style={{ color: AMBER }}>30</span></div>
              <div style={{ display: 'flex', fontSize: 13, letterSpacing: 3.5, color: '#9db5e8', fontWeight: 700, marginTop: 6 }}>SHARIF TECHNOLOGIES DEVELOPER FORGE</div>
            </div>
          </div>
          <div style={{ display: 'flex', background: AMBER, color: '#2a1c00', fontWeight: 700, fontSize: 16, letterSpacing: 3, padding: '9px 18px', borderRadius: 999 }}>STUDENT ID CARD</div>
        </div>
        <div style={{ display: 'flex', marginTop: 22 }}>
          <div style={{ display: 'flex', width: 236, height: 296, padding: 6, borderRadius: 18, background: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.45)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUri(ph.photo, 'image/jpeg')} width={224} height={284} alt="" style={{ borderRadius: 13, objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 34, width: 450 }}>
            {label('PARTICIPANT')}
            <div style={{ display: 'flex', fontSize: nameSize, fontWeight: 700, lineHeight: 1.1, marginTop: 4, letterSpacing: -0.5 }}>{name}</div>
            <div style={{ display: 'flex', marginTop: 18 }}>{label('STUDENT ID')}</div>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 40, fontWeight: 700, color: AMBER, marginTop: 2, letterSpacing: 1 }}>{c.student_id}</div>
            <div style={{ display: 'flex', marginTop: 14 }}>{label('SERIAL NO.')}</div>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 25, fontWeight: 700, marginTop: 2, letterSpacing: 2 }}>{c.serial}</div>
            <div style={{ display: 'flex', marginTop: 14 }}>{label('COHORT')}</div>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, marginTop: 2 }}>{c.cohort_label || s.cohortName}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', background: '#fff', padding: 6, borderRadius: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUri} width={168} height={168} alt="" />
            </div>
            <div style={{ display: 'flex', fontSize: 12, letterSpacing: 2, color: '#9db5e8', marginTop: 8, fontWeight: 700 }}>SCAN TO VERIFY</div>
          </div>
        </div>
        {chips.length > 0 && <div style={{ display: 'flex', marginTop: 16, marginLeft: 270 }}>{chips.map(([k, v]) => <div key={k} style={{ display: 'flex' }}>{chip(k, v)}</div>)}</div>}
      </div>
      <div style={{ position: 'absolute', display: 'flex', left: 14, right: 0, bottom: 0, height: 58, background: BRAND, alignItems: 'center', justifyContent: 'space-between', padding: '0 44px 0 44px' }}>
        <div style={{ display: 'flex', fontWeight: 700, fontSize: 18, letterSpacing: 4 }}>30 DAYS • 60 HOURS • BUILD FOR REAL</div>
        <div style={{ display: 'flex', fontFamily: 'Serif', fontStyle: 'italic', fontSize: 22 }}>Knowledge Is Power</div>
      </div>
    </div>
  );

  const terms = ['This card identifies the holder as a confirmed participant of FORGE30.', 'It is issued and owned by SHARIF TECHNOLOGIES and is not transferable.', 'Carry it to every in-person session where requested.', 'It does not itself certify completion of the program.', `If found, please return it to SHARIF TECHNOLOGIES${[s.organizer.website && s.organizer.website.replace(/^https?:\/\//, ''), s.organizer.phone, s.organizer.email].filter(Boolean).join(' · ') ? ' — ' + [s.organizer.website && s.organizer.website.replace(/^https?:\/\//, ''), s.organizer.phone, s.organizer.email].filter(Boolean).join(' · ') : ''}.`];
  const back = (
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', overflow: 'hidden', fontFamily: 'Sans', background: '#eef3fc', color: NAVY }}>
      <div style={{ position: 'absolute', display: 'flex', left: 0, top: 0, right: 0, height: 92, background: NAVY }} />
      <div style={{ position: 'absolute', display: 'flex', left: 0, top: 92, right: 0, height: 6, background: AMBER }} />
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '0 52px' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 92 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSmUri} width={84} height={84} alt="" style={{ borderRadius: 42 }} />
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 16, color: '#fff' }}>
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, lineHeight: 1 }}>SHARIF TECHNOLOGIES</div>
            <div style={{ display: 'flex', fontSize: 13, letterSpacing: 4, color: '#9db5e8', marginTop: 5, fontWeight: 700 }}>FORGE30 · DEVELOPER FORGE</div>
          </div>
        </div>
        <div style={{ display: 'flex', marginTop: 38 }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 30 }}>
            <div style={{ display: 'flex', fontSize: 15, letterSpacing: 3, color: BRAND, fontWeight: 700 }}>TERMS OF USE</div>
            {terms.map((t) => <div key={t} style={{ display: 'flex', fontSize: 19, marginTop: 11, lineHeight: 1.3 }}><span style={{ display: 'flex', width: 9, height: 9, background: BRAND, marginRight: 14, marginTop: 8, borderRadius: 2 }} /><span style={{ display: 'flex', flex: 1 }}>{t}</span></div>)}
            <div style={{ display: 'flex', marginTop: 34, alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', width: 420 }}>
                <div style={{ display: 'flex', borderBottom: `2px solid ${NAVY}`, height: 34 }} />
                <div style={{ display: 'flex', fontSize: 13, letterSpacing: 2, marginTop: 6, fontWeight: 700, color: '#4a5878', whiteSpace: 'nowrap' }}>AUTHORISED BY SHARIF TECHNOLOGIES</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: '#fff', padding: 12, borderRadius: 16, border: '2px solid #c9d7f0' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUri} width={230} height={230} alt="" />
            </div>
            <div style={{ display: 'flex', fontSize: 14, letterSpacing: 3, marginTop: 12, fontWeight: 700, color: BRAND }}>SCAN TO VERIFY</div>
            <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 22, fontWeight: 700, marginTop: 6, letterSpacing: 2 }}>{c.serial}</div>
            {issued && <div style={{ display: 'flex', fontSize: 13, letterSpacing: 2, color: '#4a5878', marginTop: 6, fontWeight: 700 }}>ISSUED {issued}</div>}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', display: 'flex', left: 0, right: 0, bottom: 0, height: 44, background: BRAND, color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: 16, letterSpacing: 4, fontWeight: 700 }}>30 DAYS • 60 HOURS • BUILD FOR REAL</div>
    </div>
  );

  const fonts = [
    { name: 'Sans', data: sans, weight: 400 as const, style: 'normal' as const }, { name: 'Sans', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Mono', data: mono, weight: 700 as const, style: 'normal' as const }, { name: 'Serif', data: serif, weight: 400 as const, style: 'italic' as const },
  ];
  const headers = { 'Cache-Control': 'private, no-store' };
  const png = async (el: React.ReactElement) => Buffer.from(await new ImageResponse(el, { width: W, height: H, fonts }).arrayBuffer());

  let res: ImageResponse;
  if (side === '3d') {
    // 3D-style showcase: both faces of the real card, slanted with depth and shadow, for sharing.
    const [f, b] = await Promise.all([png(front), png(back)]);
    const fu = dataUri(f, 'image/png'), bu = dataUri(b, 'image/png');
    const tilt = 'skew(-10deg, 3deg)';
    res = new ImageResponse((
      <div style={{ width: 1600, height: 1000, display: 'flex', position: 'relative', overflow: 'hidden', fontFamily: 'Sans', color: '#fff', backgroundImage: `linear-gradient(135deg, ${NAVY} 0%, #0b2257 60%, #1e5ecf 150%)` }}>
        <div style={{ position: 'absolute', display: 'flex', left: -200, bottom: -300, width: 900, height: 900, borderRadius: 450, background: 'rgba(30,94,207,0.28)' }} />
        <div style={{ position: 'absolute', display: 'flex', right: -150, top: -250, width: 700, height: 700, borderRadius: 350, border: '2px solid rgba(255,255,255,0.1)' }} />
        <div style={{ position: 'absolute', display: 'flex', left: 520, top: 300, width: 900, transform: `rotate(7deg) ${tilt}`, opacity: 0.92, boxShadow: '0 40px 80px rgba(0,0,0,0.55)', borderRadius: 26 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bu} width={900} height={567} alt="" style={{ borderRadius: 26 }} />
        </div>
        <div style={{ position: 'absolute', display: 'flex', left: 150, top: 150, width: 960, transform: `rotate(-9deg) ${tilt}`, boxShadow: '-30px 50px 90px rgba(0,0,0,0.6)', borderRadius: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fu} width={960} height={605} alt="" style={{ borderRadius: 28 }} />
        </div>
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', left: 70, bottom: 56 }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 6, color: AMBER, fontWeight: 700 }}>FORGE30 · SHARIF TECHNOLOGIES</div>
          <div style={{ display: 'flex', fontSize: 54, fontWeight: 700, marginTop: 6 }}>{c.name}</div>
          <div style={{ display: 'flex', fontFamily: 'Mono', fontSize: 30, fontWeight: 700, color: '#9db5e8', marginTop: 4, letterSpacing: 2 }}>{c.student_id}</div>
        </div>
      </div>
    ), { width: 1600, height: 1000, fonts, headers });
  } else {
    res = new ImageResponse(side === 'back' ? back : front, { width: W, height: H, fonts, headers });
  }
  if (u.searchParams.get('dl')) res.headers.set('Content-Disposition', `attachment; filename="forge30-student-card-${c.student_id}-${side}.png"`);
  return res;
}
