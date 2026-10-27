import { notFound } from 'next/navigation';
import { EditorialEntryPage } from '../../../components/EditorialEntry';
import { sideboardPages } from '../../../lib/editorialContent';
import { pageMetadata } from '../../../lib/seo';

export function generateStaticParams() { return sideboardPages.map(page => ({ slug: page.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = sideboardPages.find(item => item.slug === slug);
  return page ? pageMetadata(page.title, page.description, `/sideboards/${page.slug}`) : {};
}
export default async function SideboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = sideboardPages.find(item => item.slug === slug);
  if (!page) notFound();
  return <EditorialEntryPage entry={page} parent="sideboards" />;
}
