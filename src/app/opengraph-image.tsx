import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'FORGE30 — SHARIF TECHNOLOGIES Developer Forge. 30 days, 60 hours, build for real.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logo = 'data:image/png;base64,' + (await readFile(join(process.cwd(), 'public/brand/sharif-logo.png'))).toString('base64');
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 70, background: '#071230', color: '#fff', backgroundImage: 'linear-gradient(135deg,#071230 55%,#1e5ecf 140%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={84} height={84} alt="" />
          <div style={{ display: 'flex', fontSize: 28, letterSpacing: 6, color: '#b8cbf3', fontWeight: 700 }}>SHARIF TECHNOLOGIES</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 190, fontWeight: 800, letterSpacing: -8, lineHeight: 1 }}>FORGE30</div>
          <div style={{ display: 'flex', fontSize: 34, letterSpacing: 8, color: '#f6b93b', fontWeight: 700, marginTop: 14 }}>DEVELOPER FORGE</div>
        </div>
        <div style={{ display: 'flex', fontSize: 38, fontWeight: 700, letterSpacing: 4 }}>30 DAYS • 60 HOURS • BUILD FOR REAL</div>
      </div>
    ),
    size,
  );
}
