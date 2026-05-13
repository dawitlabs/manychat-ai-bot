import PageContainer from '@/components/layout/page-container';
import { ReportsView } from '@/features/reports/components/reports-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports — Kyle AI'
};

export default function ReportsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Reports</h2>
          <p className='text-muted-foreground text-sm'>Revenue pipeline estimates and weekly performance breakdowns</p>
        </div>
        <ReportsView />
      </div>
    </PageContainer>
  );
}
