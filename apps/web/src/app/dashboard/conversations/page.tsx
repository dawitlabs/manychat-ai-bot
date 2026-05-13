import PageContainer from '@/components/layout/page-container';
import { ConversationsView } from '@/features/conversations/components/conversations-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conversations — Kyle AI'
};

export default function ConversationsPage() {
  return (
    <PageContainer>
      <div className='flex h-[calc(100vh-8rem)] flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Conversations</h2>
          <p className='text-muted-foreground text-sm'>All lead conversations — click a row to view the chat</p>
        </div>
        <div className='min-h-0 flex-1'>
          <ConversationsView />
        </div>
      </div>
    </PageContainer>
  );
}
