import { EditorialPage } from '../../../components/SiteChrome';
import { cookies } from 'next/headers';
import { openToken } from '../../../lib/waitlist';
import { pageMetadata } from '../../../lib/seo';

export const metadata = { ...pageMetadata('Early access status', 'The result of a KR8A email preference request.', '/early-access/confirmed'), robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Confirmed() {
  const cookieStore = await cookies();
  const result = process.env.WAITLIST_TOKEN_SECRET && openToken(cookieStore.get('kr8a-email-result')?.value || '', process.env.WAITLIST_TOKEN_SECRET, 'result');
  const valid = result && typeof result.timestamp === 'number' && result.timestamp <= Date.now() && Date.now() - result.timestamp < 300000;
  const ok = valid && result.outcome === 'confirmed';
  const unsubscribed = valid && result.outcome === 'unsubscribed';
  return <EditorialPage eyebrow="Early access" title={ok ? 'You are on the list.' : unsubscribed ? 'Your choice is saved.' : 'We could not confirm that request.'} intro={ok ? 'Thank you for joining KR8A early access. We will write when there is something worth sharing.' : unsubscribed ? 'You have been unsubscribed from KR8A launch and product updates.' : 'Please try the link in your email again, or request a fresh confirmation link when signup is open.'} crumbs={[{ name: 'Early access status', path: '/early-access/confirmed' }]}><p className="confirmation-note">{ok ? 'You can unsubscribe from any future launch email.' : 'Read our privacy notice for more about your choices.'}</p></EditorialPage>;
}
