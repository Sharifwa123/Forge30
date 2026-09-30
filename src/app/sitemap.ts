import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/apply', '/status', '/privacy'].map((p) => ({ url: SITE.url + p, changeFrequency: 'weekly', priority: p === '' ? 1 : 0.7 }));
}
