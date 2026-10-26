import { notFound } from 'next/navigation';
import { EditorialEntryPage } from '../../../components/EditorialEntry';
import { journalArticles } from '../../../lib/editorialContent';
import { pageMetadata } from '../../../lib/seo';

export function generateStaticParams() { return journalArticles.map(article => ({ slug: article.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }) {
  const article = journalArticles.find(item => item.slug === params.slug);
  return article ? pageMetadata(article.seoTitle ?? article.title, article.description, `/journal/${article.slug}`, 'article') : {};
}
export default function JournalArticle({ params }: { params: { slug: string } }) {
  const article = journalArticles.find(item => item.slug === params.slug);
  if (!article) notFound();
  return <EditorialEntryPage entry={article} parent="journal" />;
}
