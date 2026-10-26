import Link from 'next/link';
import { EditorialPage, TextSection } from '../../components/SiteChrome';
import { pageMetadata } from '../../lib/seo';

export const metadata = { ...pageMetadata('Privacy', 'How KR8A handles early-access enquiries and information submitted through this website.', '/privacy'), robots: { index: false, follow: true } };
export default function Privacy() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return <EditorialPage eyebrow="Privacy" title="Your information, handled with care." intro="This page explains the limited personal information the KR8A website collects while our collection is in development." crumbs={[{ name: 'Privacy', path: '/privacy' }]}>
    <TextSection title="Who is responsible"><p>KR8A is responsible for information collected through this website. {email ? <>Questions and privacy requests can be sent to <a href={`mailto:${email}`}>{email}</a>.</> : <>An official privacy contact address will be published before the early-access form is activated.</>}</p></TextSection>
    <TextSection title="Early-access updates"><p>When enabled, the form will ask for your email address and a separate, unticked consent to receive launch and product updates. We will record the time and wording of that consent. We will use your address for those updates and to manage your subscription, and will not sell it.</p><p>The form remains unavailable until private storage, delivery, unsubscribe handling and the official contact details are tested. No signup data is currently collected through it.</p></TextSection>
    <TextSection title="Storage and service providers"><p>When enabled, confirmed signup records will be held privately as KR8A contacts in Resend. Resend will also send confirmation and launch emails. Consent and confirmation timestamps will be recorded with the contact. The retention period and any international data-transfer safeguards will be reviewed and stated here before activation.</p></TextSection>
    <TextSection title="Your choices"><p>Once signup is live, each marketing email will offer a way to unsubscribe. You may also request access, correction or deletion of your personal information through the official contact address when published. You can read about your rights and complain to the UK Information Commissioner’s Office at <a href="https://ico.org.uk/make-a-complaint/" rel="external">ico.org.uk</a>.</p></TextSection>
    <TextSection title="Other website data"><p>The site does not currently use advertising or analytics cookies. The configurator prototype may save a draft design in your browser’s local storage if you use it. Our hosting provider may process technical request logs to serve and secure the website.</p><p>Typography is loaded from Google Fonts, which may receive technical request information such as your IP address. This notice will be updated before any analytics, additional cookies or live signup processing begins.</p></TextSection>
    <div className="editorial-link-row"><Link href="/cookies">Cookie information ↗</Link><Link href="/contact">Contact KR8A ↗</Link></div>
  </EditorialPage>;
}
