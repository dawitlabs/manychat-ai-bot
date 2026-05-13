'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, Cell, Pie, PieChart } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useLeads, deriveFunnelData, deriveSourceData, deriveWeeklyPerformance } from '@/lib/api-client';

const funnelConfig = { count: { label: 'Leads', color: 'var(--chart-1)' } } satisfies ChartConfig;
const sourceConfig = {
  count: { label: 'Leads' },
  'Instagram DM': { label: 'Instagram DM', color: 'var(--chart-1)' },
  'Facebook DM': { label: 'Facebook DM', color: 'var(--chart-2)' },
  'Comment Trigger': { label: 'Comment Trigger', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const performanceTips = [
  { title: 'Acknowledge the struggle first', tip: 'Messages that start with empathy get far more replies than ones that jump straight to the pitch.' },
  { title: 'Short messages convert better', tip: 'Keep AI messages under 3 sentences. One question, one statement. Walls of text make leads ghost.' },
  { title: 'Use their words back at them', tip: 'When a lead says "I stress eat" — say "stress eating" back. Pattern matching builds instant trust.' },
  { title: 'Specific social proof closes', tip: '"Kyle\'s helped 40+ guys in your exact situation" lands better than "Kyle is a great coach."' },
  { title: 'Offer the call before fully qualified', tip: 'If they\'ve answered 3-4 questions and seem engaged, drop the calendar link. Waiting kills momentum.' },
];

function EmptyState({ label }: { label: string }) {
  return (
    <div className='flex h-[240px] items-center justify-center text-center'>
      <div>
        <Icons.trendingUp className='mx-auto h-8 w-8 text-muted-foreground/30 mb-2' />
        <p className='text-sm text-muted-foreground'>{label}</p>
      </div>
    </div>
  );
}

export function AnalyticsView() {
  const { leads, isLoading } = useLeads();
  const funnelData = deriveFunnelData(leads);
  const sourceData = deriveSourceData(leads);
  const weeklyPerformance = deriveWeeklyPerformance(leads);
  const totalSource = sourceData.reduce((a, b) => a + b.count, 0);
  const hasData = leads.length > 0;

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Lead progression through each funnel step</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasData ? <EmptyState label='No leads yet — funnel will populate as the bot qualifies leads' /> : (
              <ChartContainer config={funnelConfig} className='h-[240px] w-full'>
                <BarChart data={funnelData} layout='vertical' margin={{ left: 16, right: 20 }}>
                  <YAxis dataKey='step' type='category' tickLine={false} axisLine={false} width={140} tick={{ fontSize: 11 }} />
                  <XAxis type='number' tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey='count' fill='var(--chart-1)' radius={[0, 4, 4, 0]}>
                    {funnelData.map((_, i) => <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />)}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Source Breakdown</CardTitle>
            <CardDescription>Where your leads are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasData ? <EmptyState label='No leads yet — sources will show once the bot starts receiving DMs' /> : (
              <div className='flex items-center gap-4'>
                <ChartContainer config={sourceConfig} className='h-[200px] w-[200px] flex-shrink-0'>
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey='count' />} />
                    <Pie data={sourceData} dataKey='count' nameKey='source' innerRadius={40} cornerRadius={6} paddingAngle={3}>
                      {sourceData.map((_, i) => <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />)}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className='flex flex-col gap-2'>
                  {sourceData.map((s, i) => (
                    <div key={s.source} className='flex items-center gap-2'>
                      <div className='h-3 w-3 rounded-sm flex-shrink-0' style={{ background: `var(--chart-${(i % 5) + 1})` }} />
                      <div>
                        <p className='text-sm font-medium'>{s.source}</p>
                        <p className='text-muted-foreground text-xs'>
                          {s.count} leads ({totalSource > 0 ? ((s.count / totalSource) * 100).toFixed(1) : 0}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          {weeklyPerformance.length === 0 ? (
            <div className='py-10 text-center text-sm text-muted-foreground'>
              No weekly data yet — check back once leads start coming in
            </div>
          ) : (
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
                      <Badge variant='outline' className={
                        parseFloat(row.conversionRate) >= 25 ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        parseFloat(row.conversionRate) >= 15 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                        'bg-muted text-muted-foreground'
                      }>{row.conversionRate}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Converting Message Patterns — these are static coaching tips, not data-driven */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.sparkles className='h-5 w-5' />
            Top Converting Message Patterns
          </CardTitle>
          <CardDescription>Patterns from Kyle's proven conversation transcripts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
            {performanceTips.map((tip, i) => (
              <div key={i} className='bg-muted/50 rounded-lg border p-4 space-y-1.5'>
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
