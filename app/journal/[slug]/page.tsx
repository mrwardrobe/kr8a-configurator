import { notFound } from 'next/navigation';
import { EditorialEntryPage } from '../../../components/EditorialEntry';
import { journalArticles } from '../../../lib/editorialContent';
import { pageMetadata } from '../../../lib/seo';

export function generateStaticParams() { return journalArticles.map(article => ({ slug: article.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = journalArticles.find(item => item.slug === slug);
  return article ? pageMetadata(article.seoTitle ?? article.title, article.description, `/journal/${article.slug}`, 'article') : {};
}
export default async function JournalArticle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = journalArticles.find(item => item.slug === slug);
  if (!article) notFound();
  return <EditorialEntryPage entry={article} parent="journal" />;
}
