import PageContainer from '@/components/layout/page-container';
import { KnowledgeView } from '@/features/knowledge/components/knowledge-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Knowledge - Kyle AI'
};

export default function KnowledgePage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>AI Knowledge</h2>
          <p className='text-muted-foreground text-sm'>Approved facts and notes Kyle AI can use in DMs</p>
        </div>
        <KnowledgeView />
      </div>
    </PageContainer>
  );
}
