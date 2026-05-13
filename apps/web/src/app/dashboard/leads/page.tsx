import PageContainer from '@/components/layout/page-container';
import { LeadsView } from '@/features/leads/components/leads-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Leads — Kyle AI'
};

export default function LeadsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>All Leads</h2>
          <p className='text-muted-foreground text-sm'>Full CRM view of every lead in the system</p>
        </div>
        <LeadsView />
      </div>
    </PageContainer>
  );
}
