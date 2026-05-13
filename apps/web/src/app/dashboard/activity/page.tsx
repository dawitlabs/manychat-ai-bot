import PageContainer from '@/components/layout/page-container';
import { ActivityView } from '@/features/activity/components/activity-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bot Activity — Kyle AI'
};

export default function ActivityPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Bot Activity</h2>
          <p className='text-muted-foreground text-sm'>Live feed of AI conversations and funnel events</p>
        </div>
        <ActivityView />
      </div>
    </PageContainer>
  );
}
