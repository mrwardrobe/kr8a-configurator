import type { MetadataRoute } from 'next';
import { publicSiteUrl } from '../lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = publicSiteUrl();
  return siteUrl ? [{ url: `${siteUrl}/`, changeFrequency: 'monthly', priority: 1 }] : [];
}
