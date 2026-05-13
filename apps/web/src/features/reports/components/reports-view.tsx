'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Legend } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Icons } from '@/components/icons';
import { weeklyPerformance } from '@/lib/mock-data';

const trendConfig = {
  leads: { label: 'New Leads', color: 'var(--chart-1)' },
  calls: { label: 'Calls Booked', color: 'var(--chart-2)' }
} satisfies ChartConfig;

const monthlyTrend = [
  { month: 'Dec', leads: 18, calls: 5 },
  { month: 'Jan', leads: 24, calls: 7 },
  { month: 'Feb', leads: 31, calls: 9 },
  { month: 'Mar', leads: 28, calls: 10 },
  { month: 'Apr', leads: 39, calls: 13 },
  { month: 'May', leads: 47, calls: 16 }
];

const bestWeek = { week: 'Week of Apr 14', newLeads: 12, booked: 5, revenue: '$14,250' };
const worstWeek = { week: 'Week of Dec 16', newLeads: 4, booked: 1, revenue: '$2,850' };

export function ReportsView() {
  const avgDealSize = 2850;
  const totalLeads = 47;
  const estCloseRate = 0.35;
  const estCloses = Math.round(totalLeads * estCloseRate);
  const estRevenue = estCloses * avgDealSize;

  return (
    <div className='space-y-6'>
      {/* Revenue Pipeline Hero */}
      <Card className='border-primary/30 bg-gradient-to-br from-primary/5 to-card relative overflow-hidden'>
        <div className='absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none' />
        <CardHeader>
          <div className='flex items-center gap-2 mb-2'>
            <Icons.dollar className='h-5 w-5 text-primary' />
            <CardDescription>Estimated Revenue Pipeline</CardDescription>
          </div>
          <CardTitle className='text-5xl font-bold tabular-nums text-primary'>
            ${estRevenue.toLocaleString()}
          </CardTitle>
          <p className='text-muted-foreground text-sm mt-1'>
            Based on current conversion rate and average program value
          </p>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-4'>
            <div className='rounded-lg bg-background/50 border border-border/50 p-3 text-center'>
              <p className='text-2xl font-bold tabular-nums'>{totalLeads}</p>
              <p className='text-muted-foreground text-xs mt-1'>Leads in Pipeline</p>
            </div>
            <div className='rounded-lg bg-background/50 border border-border/50 p-3 text-center'>
              <p className='text-2xl font-bold tabular-nums'>{estCloses}</p>
              <p className='text-muted-foreground text-xs mt-1'>Estimated Closes</p>
            </div>
            <div className='rounded-lg bg-background/50 border border-border/50 p-3 text-center'>
              <p className='text-2xl font-bold tabular-nums'>${avgDealSize.toLocaleString()}</p>
              <p className='text-muted-foreground text-xs mt-1'>Avg Deal Size</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Leads vs. calls booked over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className='h-[260px] w-full'>
            <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id='leads-gradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--chart-1)' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='var(--chart-1)' stopOpacity={0} />
                </linearGradient>
                <linearGradient id='calls-gradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='var(--chart-2)' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='var(--chart-2)' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis dataKey='month' tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Area
                type='monotone'
                dataKey='leads'
                stroke='var(--chart-1)'
                fill='url(#leads-gradient)'
                strokeWidth={2}
              />
              <Area
                type='monotone'
                dataKey='calls'
                stroke='var(--chart-2)'
                fill='url(#calls-gradient)'
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Best / Worst Week */}
      <div className='grid gap-4 md:grid-cols-2'>
        <Card className='border-green-500/30 bg-green-500/5'>
          <CardHeader className='pb-2'>
            <div className='flex items-center gap-2'>
              <Icons.flame className='h-4 w-4 text-green-500' />
              <CardTitle className='text-sm text-green-400'>Best Week</CardTitle>
            </div>
            <CardDescription>{bestWeek.week}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-3 gap-2 text-center'>
              <div>
                <p className='text-xl font-bold text-green-400'>{bestWeek.newLeads}</p>
                <p className='text-xs text-muted-foreground'>Leads</p>
              </div>
              <div>
                <p className='text-xl font-bold text-green-400'>{bestWeek.booked}</p>
                <p className='text-xs text-muted-foreground'>Booked</p>
              </div>
              <div>
                <p className='text-xl font-bold text-green-400'>{bestWeek.revenue}</p>
                <p className='text-xs text-muted-foreground'>Est. Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className='border-red-500/20 bg-red-500/5'>
          <CardHeader className='pb-2'>
            <div className='flex items-center gap-2'>
              <Icons.trendingDown className='h-4 w-4 text-red-400' />
              <CardTitle className='text-sm text-red-400'>Worst Week</CardTitle>
            </div>
            <CardDescription>{worstWeek.week}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-3 gap-2 text-center'>
              <div>
                <p className='text-xl font-bold text-red-400'>{worstWeek.newLeads}</p>
                <p className='text-xs text-muted-foreground'>Leads</p>
              </div>
              <div>
                <p className='text-xl font-bold text-red-400'>{worstWeek.booked}</p>
                <p className='text-xs text-muted-foreground'>Booked</p>
              </div>
              <div>
                <p className='text-xl font-bold text-red-400'>{worstWeek.revenue}</p>
                <p className='text-xs text-muted-foreground'>Est. Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Breakdown</CardTitle>
          <CardDescription>Lead pipeline metrics with revenue estimates by week</CardDescription>
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
                <TableHead className='text-right'>Est. Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeklyPerformance.map((row) => {
                const revenue = row.booked * avgDealSize;
                return (
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
                    <TableCell className='text-right tabular-nums font-medium text-primary'>
                      ${revenue.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
