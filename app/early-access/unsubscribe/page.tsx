import { EditorialPage } from '../../../components/SiteChrome';
import { EmailPreferenceForm } from '../../../components/EmailPreferenceForm';
import { verifyConfirmation } from '../../../lib/waitlist';
import { pageMetadata } from '../../../lib/seo';

export const metadata = { ...pageMetadata('Unsubscribe', 'Manage a KR8A email subscription or cancel a pending request.', '/early-access/unsubscribe'), robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : '';
  const valid = process.env.WAITLIST_TOKEN_SECRET && verifyConfirmation(token, process.env.WAITLIST_TOKEN_SECRET, Date.now(), 'unsubscribe');
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return <EditorialPage eyebrow="Email preferences" title={valid ? 'A quieter inbox.' : 'This link is unavailable.'} intro={valid ? 'Confirm below to stop KR8A launch and product updates or cancel a pending signup.' : 'Use the unsubscribe link in your most recent email, or contact KR8A for help.'} crumbs={[{ name: 'Unsubscribe', path: '/early-access/unsubscribe' }]}>
    {valid && <EmailPreferenceForm token={token} action="unsubscribe" />}
    {email && <p className="confirmation-note">You can also email <a href={`mailto:${email}`}>{email}</a> to withdraw consent or request deletion.</p>}
  </EditorialPage>;
}
