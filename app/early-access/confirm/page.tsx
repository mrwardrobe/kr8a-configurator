import { EditorialPage } from '../../../components/SiteChrome';
import { verifyConfirmation } from '../../../lib/waitlist';
import { EmailPreferenceForm } from '../../../components/EmailPreferenceForm';
import { pageMetadata } from '../../../lib/seo';

export const metadata = { ...pageMetadata('Confirm early access', 'Confirm a requested KR8A email subscription.', '/early-access/confirm'), robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default async function Confirm({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const verified = process.env.WAITLIST_TOKEN_SECRET && typeof params.token === 'string' ? verifyConfirmation(params.token, process.env.WAITLIST_TOKEN_SECRET) : null;
  return <EditorialPage eyebrow="Early access" title={verified ? 'One final step.' : 'This link has expired.'} intro={verified ? 'Confirm that you want KR8A launch and product updates by email.' : 'Please request a fresh link when early-access signup is open.'} crumbs={[{ name: 'Confirm early access', path: '/early-access/confirm' }]}>
    {verified && <EmailPreferenceForm token={params.token!} action="confirm" />}
  </EditorialPage>;
}
