import { EditorialPage } from '../../../components/SiteChrome';

export const metadata = { title: 'Early access status | KR8A', robots: { index: false, follow: false } };
export default function Confirmed({ searchParams }: { searchParams: { status?: string } }) {
  const ok = searchParams.status === 'ok';
  return <EditorialPage eyebrow="Early access" title={ok ? 'You are on the list.' : 'We could not confirm that request.'} intro={ok ? 'Thank you for joining KR8A early access. We will write when there is something worth sharing.' : 'Your address has not been added. The link may have expired, or the service may be temporarily unavailable.'} crumbs={[{ name: 'Early access status', path: '/early-access/confirmed' }]}><p className="confirmation-note">{ok ? 'You can unsubscribe from any future launch email.' : 'Please request a new link when signup is open.'}</p></EditorialPage>;
}
