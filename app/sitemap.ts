import type { MetadataRoute } from 'next';
import { publicSiteUrl } from '../lib/site';
import { publicPaths } from '../lib/publicPaths';
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = publicSiteUrl();
  if (!siteUrl) return [];
  return publicPaths.map((path, index) => ({ url: new URL(path, siteUrl).toString(), changeFrequency: 'monthly', priority: index === 0 ? 1 : index < 2 ? 0.8 : 0.6 }));
}
