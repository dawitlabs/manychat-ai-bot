'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { weeklyLeadData } from '@/lib/mock-data';

const chartConfig = {
  leads: {
    label: 'New Leads',
    color: 'var(--chart-1)'
  },
  messages: {
    label: 'Messages',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function LeadVolumeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Lead Volume
          <Badge variant='outline'>
            <Icons.trendingUp />
            Last 7 Days
          </Badge>
        </CardTitle>
        <CardDescription>Daily new conversations started</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={weeklyLeadData}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis
              dataKey='day'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <pattern id='dots-leads' x='0' y='0' width='7' height='7' patternUnits='userSpaceOnUse'>
                <circle cx='5' cy='5' r='1.5' fill='var(--color-leads)' opacity={0.5} />
              </pattern>
              <pattern id='dots-messages' x='0' y='0' width='7' height='7' patternUnits='userSpaceOnUse'>
                <circle cx='5' cy='5' r='1.5' fill='var(--color-messages)' opacity={0.5} />
              </pattern>
            </defs>
            <Area
              dataKey='messages'
              type='natural'
              fill='url(#dots-messages)'
              fillOpacity={0.4}
              stroke='var(--color-messages)'
              stackId='a'
              strokeWidth={0.8}
            />
            <Area
              dataKey='leads'
              type='natural'
              fill='url(#dots-leads)'
              fillOpacity={0.4}
              stroke='var(--color-leads)'
              stackId='a'
              strokeWidth={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
