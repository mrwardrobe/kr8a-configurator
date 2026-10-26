import type { Metadata } from 'next';
import { publicSiteUrl } from './site';

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const origin = publicSiteUrl() ?? 'https://kr8a.com';
  const url = new URL(path, origin).toString();
  return {
    title: `${title} | KR8A`,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', title: `${title} | KR8A`, description, url, siteName: 'KR8A' },
  };
}

export function breadcrumbJson(items: { name: string; path: string }[]) {
  const origin = publicSiteUrl() ?? 'https://kr8a.com';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name,
      item: new URL(item.path, origin).toString(),
    })),
  };
}
