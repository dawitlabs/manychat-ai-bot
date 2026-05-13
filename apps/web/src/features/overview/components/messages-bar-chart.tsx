'use client';

import { Bar, BarChart, XAxis } from 'recharts';
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
  messages: {
    label: 'Messages',
    color: 'var(--chart-1)'
  },
  leads: {
    label: 'New Leads',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function MessagesBarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          Messages Per Day
          <Badge variant='outline'>
            <Icons.chat />
            7 Days
          </Badge>
        </CardTitle>
        <CardDescription>Total messages exchanged daily</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={weeklyLeadData}>
            <XAxis
              dataKey='day'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='dashed' hideLabel />}
            />
            <Bar dataKey='messages' fill='var(--color-messages)' radius={4} />
            <Bar dataKey='leads' fill='var(--color-leads)' radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
