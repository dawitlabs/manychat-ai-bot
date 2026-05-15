import Overview from '@/features/overview/components/overview';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard: Overview' };

export default function OverviewPage() {
  return <Overview />;
}
