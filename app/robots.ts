import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: '/configurator' }, sitemap: 'https://www.kr8a.com/sitemap.xml' };
}
