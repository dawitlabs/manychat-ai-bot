import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { mockStats } from '@/lib/mock-data';

export function KpiCards() {
  const stats = mockStats;

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {/* Total Leads */}
      <Card className='@container/card border-l-2 border-l-orange-500 bg-gradient-to-br from-card to-muted/30'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/15'>
              <Icons.users className='h-4.5 w-4.5 text-orange-500' />
            </div>
            <Badge variant='outline' className='text-green-500 border-green-500/30 bg-green-500/10 text-[11px]'>
              +12% from last week
            </Badge>
          </div>
          <CardDescription className='mt-3'>Total Leads</CardDescription>
          <CardTitle className='text-3xl font-bold tabular-nums'>
            {stats.totalLeads}
          </CardTitle>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1 text-sm pt-0'>
          <div className='text-muted-foreground text-xs'>Instagram + Facebook DMs</div>
        </CardFooter>
      </Card>

      {/* Active Today */}
      <Card className='@container/card border-l-2 border-l-green-500 bg-gradient-to-br from-card to-muted/30'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/15'>
              <Icons.zap className='h-4.5 w-4.5 text-green-500' />
            </div>
            <Badge variant='outline' className='text-green-500 border-green-500/30 bg-green-500/10 text-[11px]'>
              +3 from yesterday
            </Badge>
          </div>
          <CardDescription className='mt-3'>Active Today</CardDescription>
          <CardTitle className='text-3xl font-bold tabular-nums'>
            {stats.activeToday}
          </CardTitle>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1 text-sm pt-0'>
          <div className='text-muted-foreground text-xs'>Messaged in last 24 hours</div>
        </CardFooter>
      </Card>

      {/* Calls Booked */}
      <Card className='@container/card border-l-2 border-l-blue-500 bg-gradient-to-br from-card to-muted/30'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15'>
              <Icons.calendar className='h-4.5 w-4.5 text-blue-500' />
            </div>
            <Badge variant='outline' className='text-blue-500 border-blue-500/30 bg-blue-500/10 text-[11px]'>
              +2 this week
            </Badge>
          </div>
          <CardDescription className='mt-3'>Calls Booked</CardDescription>
          <CardTitle className='text-3xl font-bold tabular-nums'>
            {stats.callsBooked}
          </CardTitle>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1 text-sm pt-0'>
          <div className='text-muted-foreground text-xs'>Leads who clicked Calendly link</div>
        </CardFooter>
      </Card>

      {/* Conversion Rate */}
      <Card className='@container/card border-l-2 border-l-purple-500 bg-gradient-to-br from-card to-muted/30'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/15'>
              <Icons.target className='h-4.5 w-4.5 text-purple-500' />
            </div>
            <Badge variant='outline' className='text-purple-400 border-purple-500/30 bg-purple-500/10 text-[11px]'>
              +0.8% from last week
            </Badge>
          </div>
          <CardDescription className='mt-3'>Conversion Rate</CardDescription>
          <CardTitle className='text-3xl font-bold tabular-nums'>
            {stats.conversionRate}%
          </CardTitle>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1 text-sm pt-0'>
          <div className='text-muted-foreground text-xs'>Calls booked / total leads</div>
        </CardFooter>
      </Card>
    </div>
  );
}
