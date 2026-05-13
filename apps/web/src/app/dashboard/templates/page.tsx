import PageContainer from '@/components/layout/page-container';
import { TemplatesView } from '@/features/templates/components/templates-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Templates — Kyle AI'
};

export default function TemplatesPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Message Templates</h2>
          <p className='text-muted-foreground text-sm'>Proven message scripts organized by funnel stage</p>
        </div>
        <TemplatesView />
      </div>
    </PageContainer>
  );
}
