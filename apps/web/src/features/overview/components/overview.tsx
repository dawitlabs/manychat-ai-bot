import PageContainer from '@/components/layout/page-container';
import { KpiCards } from './kpi-cards';
import { LeadVolumeChart } from './lead-volume-chart';
import { MessagesBarChart } from './messages-bar-chart';
import { PlatformPieChart } from './platform-pie-chart';
import { RecentLeads } from './recent-leads';

export default function OverViewPage() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Command Center</h2>
          <p className='text-muted-foreground text-sm'>Real-time Kyle AI performance</p>
        </div>

        <KpiCards />

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='lg:col-span-4'>
            <LeadVolumeChart />
          </div>
          <div className='lg:col-span-3'>
            <RecentLeads />
          </div>
          <div className='lg:col-span-4'>
            <MessagesBarChart />
          </div>
          <div className='lg:col-span-3'>
            <PlatformPieChart />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
