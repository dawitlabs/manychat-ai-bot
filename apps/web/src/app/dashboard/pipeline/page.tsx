import PageContainer from '@/components/layout/page-container';
import { PipelineView } from '@/features/pipeline/components/pipeline-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pipeline — Kyle AI'
};

export default function PipelinePage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Lead Pipeline</h2>
          <p className='text-muted-foreground text-sm'>Kanban view of all leads moving through the funnel</p>
        </div>
        <PipelineView />
      </div>
    </PageContainer>
  );
}
