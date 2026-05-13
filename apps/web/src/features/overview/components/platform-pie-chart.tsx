'use client';

import { LabelList, Pie, PieChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { platformData } from '@/lib/mock-data';

const chartConfig = {
  count: { label: 'Leads' },
  instagram: { label: 'Instagram', color: 'var(--chart-1)' },
  facebook: { label: 'Facebook', color: 'var(--chart-2)' }
} satisfies ChartConfig;

export function PlatformPieChart() {
  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle className='flex items-center gap-2'>
          Platform Breakdown
          <Badge variant='outline'>
            <Icons.trendingUp />
            All Time
          </Badge>
        </CardTitle>
        <CardDescription>Instagram vs Facebook leads</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        <ChartContainer
          config={chartConfig}
          className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey='count' hideLabel />} />
            <Pie
              data={platformData}
              innerRadius={30}
              dataKey='count'
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey='platform'
                stroke='none'
                fontSize={12}
                fontWeight={500}
                fill='currentColor'
                formatter={(value: string) => value.charAt(0).toUpperCase() + value.slice(1)}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
