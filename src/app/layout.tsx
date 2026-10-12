import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DialogProvider } from '@/components/Dialog';
import { SITE } from '@/lib/content';

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#071230' };

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'FORGE30 — 30-Day Computer Skills & Software Development Program by SHARIF TECHNOLOGIES', template: '%s · FORGE30' },
  description: SITE.description,
  keywords: ['computer skills training Ghana', 'learn computer skills', 'software development training', 'web development', 'coding training', 'beginner computer course', '30-day program', 'SHARIF TECHNOLOGIES'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: 'FORGE30', title: 'FORGE30 — SHARIF TECHNOLOGIES Skills Forge', description: '30 DAYS • 60 HOURS • BUILD FOR REAL. An intensive live program in computer skills and software development for committed beginners.', url: '/', locale: 'en_GH' },
  twitter: { card: 'summary_large_image', title: 'FORGE30 — SHARIF TECHNOLOGIES Skills Forge', description: '30 DAYS • 60 HOURS • BUILD FOR REAL.' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'SHARIF TECHNOLOGIES', slogan: 'Knowledge Is Power', url: SITE.url, logo: `${SITE.url}/brand/sharif-logo.png` }) }} />
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
