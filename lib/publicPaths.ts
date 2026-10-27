import { journalArticles, sideboardPages } from './editorialContent';

// One source for the sitemap, analytics allowlist and launch audit.
export const publicPaths = ['/', '/sideboards', ...sideboardPages.map(item => `/sideboards/${item.slug}`), '/bedside-tables', '/materials', '/how-it-works', '/our-story', '/journal', ...journalArticles.map(item => `/journal/${item.slug}`)];
