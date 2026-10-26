import Link from 'next/link';
import { EditorialPage, TextSection } from '../../components/SiteChrome';
import { pageMetadata } from '../../lib/seo';

export const metadata = { ...pageMetadata('Contact', 'Find out how to contact KR8A about its developing made-to-measure sideboard collection.', '/contact'), robots: { index: false, follow: true } };
export default function Contact() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return <EditorialPage eyebrow="Contact" title="Let’s talk about what fits." intro="KR8A is preparing its first sideboard collection. We would be glad to hear from you." crumbs={[{ name: 'Contact', path: '/contact' }]}>
    <TextSection title="Get in touch">{email ? <p>For enquiries, email <a href={`mailto:${email}`}>{email}</a>. We will respond as the team becomes available.</p> : <p>Our official contact email will appear here once confirmed. For now, you can follow the launch through early access when the signup service is activated.</p>}<p>We are not yet accepting orders or payments.</p></TextSection>
    <div className="editorial-link-row"><Link href="/#early-access">Early access ↗</Link><Link href="/privacy">Privacy information ↗</Link></div>
  </EditorialPage>;
}
