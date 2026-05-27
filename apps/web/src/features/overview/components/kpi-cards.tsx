'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useStats } from '@/lib/api-client';

export function KpiCards() {
  const { data: stats } = useStats();

  const total = stats?.totalLeads ?? 0;
  const active = stats?.activeToday ?? 0;
  const booked = stats?.callsBooked ?? 0;
  const rate = stats?.conversionRate ?? '0.0';
  const cost = stats?.costTodayUsd ?? '0.0000';
  const tokens = stats?.tokensToday ?? 0;

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5'>
      <Card className='@container/card border-l-2 border-l-primary bg-gradient-to-br from-card to-muted/30'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15'>
              <Icons.users className='h-4 w-4 text-primary' />
            </div>
            <Badge variant='outline' className='text-[11px]'>All Time</Badge>
          </div>
          <CardDescription className='mt-3'>Total Leads</CardDescription>
          <CardTitle className='text-3xl font-bold tabular-nums'>{total}</CardTitle>
        </CardHeader>
        <CardFooter className='pt-0 text-xs text-muted-foreground'>Instagram + Facebook DMs</CardFooter>
      </Card>

      <Card className='@container/card border-l-2 border-l-primary bg-gradient-to-br from-card to-muted/30'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15'>
              <Icons.zap className='h-4 w-4 text-primary' />
            </div>
            <Badge variant='outline' className='text-[11px]'>24h</Badge>
          </div>
          <CardDescription className='mt-3'>Active Today</CardDescription>
          <CardTitle className='text-3xl font-bold tabular-nums'>{active}</CardTitle>
        </CardHeader>
        <CardFooter className='pt-0 text-xs text-muted-foreground'>Messaged in last 24 hours</CardFooter>
      </Card>

      <Card className='@container/card border-l-2 border-l-primary bg-gradient-to-br from-card to-muted/30'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15'>
              <Icons.calendar className='h-4 w-4 text-primary' />
            </div>
            <Badge variant='outline' className='text-[11px]'>Calendly</Badge>
          </div>
          <CardDescription className='mt-3'>Calls Booked</CardDescription>
          <CardTitle className='text-3xl font-bold tabular-nums'>{booked}</CardTitle>
        </CardHeader>
        <CardFooter className='pt-0 text-xs text-muted-foreground'>Leads who clicked Calendly link</CardFooter>
      </Card>

      <Card className='@container/card border-l-2 border-l-primary bg-gradient-to-br from-card to-muted/30'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15'>
              <Icons.target className='h-4 w-4 text-primary' />
            </div>
            <Badge variant='outline' className='text-[11px]'>Bookings</Badge>
          </div>
          <CardDescription className='mt-3'>Conversion Rate</CardDescription>
          <CardTitle className='text-3xl font-bold tabular-nums'>{rate}%</CardTitle>
        </CardHeader>
        <CardFooter className='pt-0 text-xs text-muted-foreground'>Calls booked / total leads</CardFooter>
      </Card>

      <Card className='@container/card border-l-2 border-l-primary bg-gradient-to-br from-card to-muted/30'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15'>
              <Icons.sparkles className='h-4 w-4 text-primary' />
            </div>
            <Badge variant='outline' className='text-[11px]'>24h</Badge>
          </div>
          <CardDescription className='mt-3'>Today&apos;s AI Spend</CardDescription>
          <CardTitle className='text-3xl font-bold tabular-nums'>${cost}</CardTitle>
        </CardHeader>
        <CardFooter className='pt-0 text-xs text-muted-foreground'>{tokens.toLocaleString()} tokens used today</CardFooter>
      </Card>
    </div>
  );
}
