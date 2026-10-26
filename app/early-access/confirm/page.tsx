import { EditorialPage } from '../../../components/SiteChrome';
import { verifyConfirmation } from '../../../lib/waitlist';

export const metadata = { title: 'Confirm early access | KR8A', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function Confirm({ searchParams }: { searchParams: { token?: string } }) {
  const verified = process.env.WAITLIST_TOKEN_SECRET && typeof searchParams.token === 'string' ? verifyConfirmation(searchParams.token, process.env.WAITLIST_TOKEN_SECRET) : null;
  return <EditorialPage eyebrow="Early access" title={verified ? 'One final step.' : 'This link has expired.'} intro={verified ? 'Confirm that you want KR8A launch and product updates by email.' : 'Please request a fresh link when early-access signup is open.'} crumbs={[{ name: 'Confirm early access', path: '/early-access/confirm' }]}>
    {verified && <form className="confirm-form" action="/api/early-access/confirm" method="post"><input type="hidden" name="token" value={searchParams.token} /><button className="button button-ink" type="submit">Confirm my email ↗</button></form>}
  </EditorialPage>;
}
