import { notFound } from 'next/navigation';
import { EditorialEntryPage } from '../../../components/EditorialEntry';
import { sideboardPages } from '../../../lib/editorialContent';
import { pageMetadata } from '../../../lib/seo';

export function generateStaticParams() { return sideboardPages.map(page => ({ slug: page.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }) {
  const page = sideboardPages.find(item => item.slug === params.slug);
  return page ? pageMetadata(page.title, page.description, `/sideboards/${page.slug}`) : {};
}
export default function SideboardPage({ params }: { params: { slug: string } }) {
  const page = sideboardPages.find(item => item.slug === params.slug);
  if (!page) notFound();
  return <EditorialEntryPage entry={page} parent="sideboards" />;
}
