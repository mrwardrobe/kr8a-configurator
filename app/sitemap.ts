import type { MetadataRoute } from 'next';
import { publicSiteUrl } from '../lib/site';
import { sideboardPages, journalArticles } from '../lib/editorialContent';
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = publicSiteUrl();
  if (!siteUrl) return [];
  const paths = ['/', '/sideboards', ...sideboardPages.map(item => `/sideboards/${item.slug}`), '/materials', '/how-it-works', '/our-story', '/journal', ...journalArticles.map(item => `/journal/${item.slug}`)];
  return paths.map((path, index) => ({ url: new URL(path, siteUrl).toString(), changeFrequency: 'monthly', priority: index === 0 ? 1 : index < 2 ? 0.8 : 0.6 }));
}
