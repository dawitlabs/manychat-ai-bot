'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, Cell, Pie, PieChart } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { funnelData, sourceData, weeklyPerformance } from '@/lib/mock-data';
import { Icons } from '@/components/icons';

const funnelConfig = {
  count: { label: 'Leads', color: 'var(--chart-1)' }
} satisfies ChartConfig;

const sourceConfig = {
  count: { label: 'Leads' },
  'Instagram DM': { label: 'Instagram DM', color: 'var(--chart-1)' },
  'Facebook DM': { label: 'Facebook DM', color: 'var(--chart-2)' },
  'Comment Trigger': { label: 'Comment Trigger', color: 'var(--chart-3)' }
} satisfies ChartConfig;

const performanceTips = [
  {
    icon: 'check' as const,
    title: 'Acknowledge the struggle first',
    tip: 'Messages that start with empathy ("Man, that\'s a tough spot...") get 3x more replies than ones that jump straight to the pitch.'
  },
  {
    icon: 'check' as const,
    title: 'Short messages convert better',
    tip: 'Keep AI messages under 3 sentences. Leads who get walls of text ghost faster. One question, one statement.'
  },
  {
    icon: 'check' as const,
    title: 'Use their words back at them',
    tip: 'When a lead says "I stress eat" — say "stress eating" back in your next message. Pattern matching builds instant trust.'
  },
  {
    icon: 'check' as const,
    title: 'Specific social proof closes',
    tip: '"Kyle\'s helped 40+ guys in your exact situation" lands better than "Kyle is a great coach." Specificity = credibility.'
  },
  {
    icon: 'check' as const,
    title: 'Offer the call before they\'re fully qualified',
    tip: 'Don\'t over-qualify. If they\'ve answered 3-4 questions and seem engaged, offer the calendar link. Waiting kills momentum.'
  }
];

export function AnalyticsView() {
  const totalSource = sourceData.reduce((a, b) => a + b.count, 0);

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Lead progression through the funnel</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={funnelConfig} className='h-[240px] w-full'>
              <BarChart
                data={funnelData}
                layout='vertical'
                margin={{ left: 20, right: 20 }}
              >
                <YAxis
                  dataKey='step'
                  type='category'
                  tickLine={false}
                  axisLine={false}
                  width={90}
                  tick={{ fontSize: 12 }}
                />
                <XAxis type='number' tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey='count' fill='var(--chart-1)' radius={[0, 4, 4, 0]}>
                  {funnelData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={`hsl(var(--chart-${(index % 5) + 1}))`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Source Breakdown</CardTitle>
            <CardDescription>Where your leads are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-4'>
              <ChartContainer config={sourceConfig} className='h-[200px] w-[200px] flex-shrink-0'>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey='count' />} />
                  <Pie
                    data={sourceData}
                    dataKey='count'
                    nameKey='source'
                    innerRadius={40}
                    cornerRadius={6}
                    paddingAngle={3}
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={index} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className='flex flex-col gap-2'>
                {sourceData.map((s, i) => (
                  <div key={s.source} className='flex items-center gap-2'>
                    <div
                      className='h-3 w-3 rounded-sm flex-shrink-0'
                      style={{ background: `hsl(var(--chart-${(i % 5) + 1}))` }}
                    />
                    <div>
                      <p className='text-sm font-medium'>{s.source}</p>
                      <p className='text-muted-foreground text-xs'>
                        {s.count} leads ({((s.count / totalSource) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>Lead pipeline metrics by week</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead className='text-right'>New Leads</TableHead>
                <TableHead className='text-right'>Qualified</TableHead>
                <TableHead className='text-right'>Booked</TableHead>
                <TableHead className='text-right'>Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyPerformance.map((row) => (
                <TableRow key={row.week}>
                  <TableCell className='font-medium'>{row.week}</TableCell>
                  <TableCell className='text-right tabular-nums'>{row.newLeads}</TableCell>
                  <TableCell className='text-right tabular-nums'>{row.qualified}</TableCell>
                  <TableCell className='text-right tabular-nums'>{row.booked}</TableCell>
                  <TableCell className='text-right'>
                    <Badge
                      variant='outline'
                      className={
                        parseFloat(row.conversionRate) >= 25
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : parseFloat(row.conversionRate) >= 15
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          : 'bg-muted text-muted-foreground'
                      }
                    >
                      {row.conversionRate}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Best Message Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.sparkles className='h-5 w-5' />
            Top Converting Message Patterns
          </CardTitle>
          <CardDescription>
            Patterns observed in conversations that converted to booked calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
            {performanceTips.map((tip, i) => (
              <div
                key={i}
                className='bg-muted/50 rounded-lg border p-4 space-y-1.5'
              >
                <div className='flex items-center gap-2'>
                  <div className='bg-primary/10 flex h-6 w-6 items-center justify-center rounded-full'>
                    <Icons.check className='text-primary h-3.5 w-3.5' />
                  </div>
                  <p className='text-sm font-semibold'>{tip.title}</p>
                </div>
                <p className='text-muted-foreground text-xs leading-relaxed'>{tip.tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
