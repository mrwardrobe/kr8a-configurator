import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ComponentOrderWorkspace from '../../../components/owner/ComponentOrderWorkspace';
import { ownerWorkspaceAvailable } from '../../../lib/ownerAccess';
import './workspace.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Component orders | KR8A Owner', description: 'KR8A owner component-order preparation workspace.',
  robots: { index: false, follow: false, nocache: true }, alternates: { canonical: null },
};
export default function ComponentOrdersPage() {
  if (!ownerWorkspaceAvailable(process.env.VERCEL_ENV, process.env.NODE_ENV)) notFound();
  return <ComponentOrderWorkspace />;
}
