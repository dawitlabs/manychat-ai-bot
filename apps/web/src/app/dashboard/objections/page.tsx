import PageContainer from '@/components/layout/page-container';
import { ObjectionsView } from '@/features/objections/components/objections-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Objection Playbook — Kyle AI'
};

export default function ObjectionsPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Objection Playbook</h2>
          <p className='text-muted-foreground text-sm'>How Kyle&apos;s AI handles every pushback</p>
        </div>
        <ObjectionsView />
      </div>
    </PageContainer>
  );
}
