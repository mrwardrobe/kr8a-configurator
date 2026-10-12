import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://www.kr8a.com/', changeFrequency: 'monthly', priority: 1 }];
}
