import PageContainer from '@/components/layout/page-container';
import { AIControlView } from '@/features/ai-control/components/ai-control-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Control — Kyle AI'
};

export default function AIControlPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>AI Control</h2>
          <p className='text-muted-foreground text-sm'>Edit prompts, funnel steps, and bot settings</p>
        </div>
        <AIControlView />
      </div>
    </PageContainer>
  );
}
