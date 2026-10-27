import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const appDir = join(root, '.next/server/app');
const sitemapFile = join(appDir, 'sitemap.xml.body');
if (!existsSync(sitemapFile)) throw new Error('Build the site before running the audit.');
const sitemap = readFileSync(sitemapFile, 'utf8');
const preview = process.argv.includes('--preview');
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
const titles = new Map();
const errors = [];
if (!paths.length) errors.push('The public sitemap is empty. Check the canonical site configuration.');
const htmlPath = path => join(appDir, path === '/' ? 'index.html' : `${path.slice(1)}.html`);
const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const htmlPages = [...paths, '/configurator', '/contact', '/privacy', '/cookies'];

for (const path of htmlPages) {
  const file = htmlPath(path);
  if (!existsSync(file)) { errors.push(`Missing route: ${path}`); continue; }
  const html = readFileSync(file, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = [...html.matchAll(/<meta[^>]+name="description"[^>]*>/g)].map(match => attr(match[0], 'content'))[0];
  const canonical = [...html.matchAll(/<link[^>]+rel="canonical"[^>]*>/g)].map(match => attr(match[0], 'href'))[0];
  const h1Count = (html.match(/<h1(?:\s|>)/g) || []).length;
  const noindex = /<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(html);
  if (!title || !description || !canonical || h1Count !== 1) errors.push(`Incomplete metadata or H1 on ${path}`);
  if (paths.includes(path) && noindex !== preview) errors.push(`${preview ? 'Preview is indexable' : 'Sitemap includes noindex page'}: ${path}`);
  if (!paths.includes(path) && !noindex) errors.push(`Unfinished page is indexable: ${path}`);
  if (title && paths.includes(path)) {
    if (titles.has(title)) errors.push(`Duplicate title: ${title} on ${path} and ${titles.get(title)}`);
    titles.set(title, path);
  }
  if (canonical && new URL(canonical).pathname !== path) errors.push(`Canonical mismatch on ${path}: ${canonical}`);
  if (canonical && new URL(canonical).origin !== 'https://kr8a.com') errors.push(`Incorrect canonical origin on ${path}`);
  if (/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)/.test(html)) errors.push(`External fonts on ${path}`);
  if (/<script[^>]+src="[^\"]*(?:_vercel\/(?:insights|speed-insights)|googletagmanager)/.test(html)) errors.push(`Measurement script in initial HTML on ${path}`);
  if (path.startsWith('/journal/') && !html.includes('"@type":"Article"')) errors.push(`Missing Article structured data on ${path}`);
  for (const match of html.matchAll(/<a[^>]+href="(\/[^"]*)"[^>]*>/g)) {
    const target = new URL(match[1], 'https://kr8a.com').pathname;
    if (target.startsWith('/early-access/')) continue;
    if (!existsSync(htmlPath(target))) errors.push(`Broken internal link ${path} → ${target}`);
  }
}
const robots = readFileSync(join(appDir, 'robots.txt.body'), 'utf8');
if (preview ? !robots.includes('Disallow: /') || robots.includes('Sitemap:') : !robots.includes('Sitemap: https://kr8a.com/sitemap.xml')) errors.push('Incorrect robots.txt for this environment');
for (const path of paths) if (!sitemap.includes(`https://kr8a.com${path === '/' ? '/' : path}<`)) errors.push(`Incorrect sitemap origin: ${path}`);
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Audited ${htmlPages.length} routes, ${paths.length} sitemap entries, unique titles, canonicals, H1s and internal links.`);
