import PageContainer from '@/components/layout/page-container';
import { KpiCards } from '@/features/overview/components/kpi-cards';
import React from 'react';

export default function OverViewLayout({
  area_stats,
  bar_stats,
  pie_stats,
  sales
}: {
  area_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  pie_stats: React.ReactNode;
  sales: React.ReactNode;
}) {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Command Center</h2>
            <p className='text-muted-foreground text-sm'>Kyle&apos;s AI Fitness Bot — Live Stats</p>
          </div>
        </div>

        <KpiCards />

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>{sales}</div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 min-h-0 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
