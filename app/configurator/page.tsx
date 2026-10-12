import type { Metadata } from 'next';
import ConfiguratorExperience from '../../components/ConfiguratorExperience';

export const metadata: Metadata = {
  title: 'Design Your Sideboard | KR8A',
  description: 'Set the size, fronts, interior, finish and base of your KR8A sideboard. Save a design and review every detail.',
  alternates: { canonical: '/configurator' },
  robots: { index: false, follow: true },
};
export default function ConfiguratorPage() { return <ConfiguratorExperience />; }
