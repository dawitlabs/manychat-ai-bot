import PageContainer from '@/components/layout/page-container';
import { IntegrationsView } from '@/features/integrations/components/integrations-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integrations — Kyle AI'
};

export default function IntegrationsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Integrations</h2>
          <p className='text-muted-foreground text-sm'>Connected services and API status</p>
        </div>
        <IntegrationsView />
      </div>
    </PageContainer>
  );
}
