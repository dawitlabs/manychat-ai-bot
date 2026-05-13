'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useLeads, deriveWeeklyData } from '@/lib/api-client';

const chartConfig = {
  leads: { label: 'New Leads', color: 'var(--chart-1)' },
  messages: { label: 'Messages', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function LeadVolumeChart() {
  const { leads } = useLeads();
  const data = deriveWeeklyData(leads);

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Lead Volume
          <Badge variant='outline'><Icons.trendingUp />Last 7 Days</Badge>
        </CardTitle>
        <CardDescription>Daily new conversations started</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis dataKey='day' tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id='grad-leads' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-leads)' stopOpacity={0.3} />
                <stop offset='95%' stopColor='var(--color-leads)' stopOpacity={0} />
              </linearGradient>
              <linearGradient id='grad-messages' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--color-messages)' stopOpacity={0.3} />
                <stop offset='95%' stopColor='var(--color-messages)' stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area dataKey='messages' type='natural' fill='url(#grad-messages)' stroke='var(--color-messages)' strokeWidth={1.5} />
            <Area dataKey='leads' type='natural' fill='url(#grad-leads)' stroke='var(--color-leads)' strokeWidth={1.5} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
