import PageContainer from '@/components/layout/page-container';
import { AnalyticsView } from '@/features/analytics/components/analytics-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics — Kyle AI'
};

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Analytics</h2>
          <p className='text-muted-foreground text-sm'>Funnel performance, lead sources, and conversion insights</p>
        </div>
        <AnalyticsView />
      </div>
    </PageContainer>
  );
}
