import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SITE } from '@/lib/content';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#071230' };

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
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'SHARIF TECHNOLOGIES', slogan: 'Knowledge Is Power', url: SITE.url, logo: `${SITE.url}/brand/sharif-logo-512.png` }) }} />
        {children}
      </body>
    </html>
  );
}
