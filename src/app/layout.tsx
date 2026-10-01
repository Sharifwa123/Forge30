import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { DialogProvider } from '@/components/Dialog';
import { SITE } from '@/lib/content';

const sans = localFont({
  src: [
    { path: '../assets/plex/ibm-plex-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/plex/ibm-plex-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../assets/plex/ibm-plex-sans-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../assets/plex/ibm-plex-sans-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans', display: 'swap',
});
const mono = localFont({
  src: [
    { path: '../assets/plex/ibm-plex-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../assets/plex/ibm-plex-mono-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../assets/plex/ibm-plex-mono-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-mono', display: 'swap',
});

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#070c18' };

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'FORGE30 — 30-Day Developer Program by SHARIF TECHNOLOGIES', template: '%s · FORGE30' },
  description: SITE.description,
  keywords: ['developer training Ghana', 'software development training', 'web development', 'coding training', 'beginner developer program', '30-day developer program', 'SHARIF TECHNOLOGIES'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: 'FORGE30', title: 'FORGE30 — SHARIF TECHNOLOGIES Developer Forge', description: '30 DAYS • 60 HOURS • BUILD FOR REAL. An intensive live developer program for committed beginners.', url: '/', locale: 'en_GH' },
  twitter: { card: 'summary_large_image', title: 'FORGE30 — SHARIF TECHNOLOGIES Developer Forge', description: '30 DAYS • 60 HOURS • BUILD FOR REAL.' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'SHARIF TECHNOLOGIES', slogan: 'Knowledge Is Power', url: SITE.url, logo: `${SITE.url}/brand/sharif-logo.png` }) }} />
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
