import type { MetadataRoute } from 'next';
import { publicSiteUrl } from '../lib/site';
export default function robots(): MetadataRoute.Robots {
  const siteUrl = publicSiteUrl();
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return { rules: { userAgent: '*', disallow: '/' } };
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml` } : {}) };
}
