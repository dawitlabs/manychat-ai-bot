'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { useLeads, useStats } from '@/lib/api-client';
import { formatDistanceToNow, subDays, startOfDay } from 'date-fns';

type EventType = 'sent' | 'received' | 'booked' | 'stalled';

const dotColor: Record<EventType, string> = {
  sent: 'bg-green-500',
  received: 'bg-blue-500',
  booked: 'bg-orange-500',
  stalled: 'bg-red-500',
};

const getHeatColor = (val: number) => {
  if (val === 0) return 'bg-muted/40';
  if (val <= 3) return 'bg-orange-500/20';
  if (val <= 7) return 'bg-orange-500/40';
  if (val <= 12) return 'bg-orange-500/60';
  if (val <= 20) return 'bg-orange-500/80';
  return 'bg-orange-500';
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function ActivityView() {
  const { leads, isLoading } = useLeads();
  const { data: stats } = useStats();

  const events = React.useMemo(() => {
    const all: Array<{ id: string; type: EventType; initials: string; description: string; preview: string; timestamp: number }> = [];

    for (const lead of leads) {
      const initials = lead.first_name.slice(0, 2).toUpperCase();

      lead.messages.forEach((msg, i) => {
        const isBookingMsg = msg.role === 'assistant' && msg.content.includes('calendly.com');
        all.push({
          id: `${lead.user_id}-${i}`,
          type: isBookingMsg ? 'booked' : msg.role === 'assistant' ? 'sent' : 'received',
          initials,
          description: isBookingMsg
            ? `${lead.first_name} received booking link — Step 6`
            : msg.role === 'assistant'
            ? `AI replied to ${lead.first_name} · Step ${lead.funnelStep}`
            : `${lead.first_name} replied · ${lead.status}`,
          preview: msg.content.slice(0, 90) + (msg.content.length > 90 ? '…' : ''),
          timestamp: msg.timestamp,
        });
      });

      if (lead.status === 'Lost') {
        all.push({
          id: `${lead.user_id}-stalled`,
          type: 'stalled',
          initials,
          description: `${lead.first_name} marked lost`,
          preview: `Last: "${lead.messages.at(-1)?.content.slice(0, 60) ?? ''}…"`,
          timestamp: lead.lastActivity,
        });
      }
    }

    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  }, [leads]);

  const heatmapData = React.useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const start = startOfDay(subDays(new Date(), 27 - i)).getTime();
      const end = start + 86_400_000;
      return leads.reduce((sum, l) => sum + l.messages.filter((m) => m.timestamp >= start && m.timestamp < end).length, 0);
    });
  }, [leads]);

  const totalMsgsToday = heatmapData[27] ?? 0;

  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-3'>
        <Card className='border-l-2 border-l-green-500'>
          <CardHeader className='pb-2'>
            <CardDescription>Messages Today</CardDescription>
            <CardTitle className='text-3xl font-bold tabular-nums'>{totalMsgsToday}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>All messages sent + received</CardContent>
        </Card>
        <Card className='border-l-2 border-l-blue-500'>
          <CardHeader className='pb-2'>
            <CardDescription>Active Conversations</CardDescription>
            <CardTitle className='text-3xl font-bold tabular-nums'>{stats?.activeToday ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>Leads messaged in last 24h</CardContent>
        </Card>
        <Card className='border-l-2 border-l-orange-500'>
          <CardHeader className='pb-2'>
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className='text-3xl font-bold tabular-nums'>{stats?.totalLeads ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className='text-xs text-muted-foreground'>All conversations started</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              Live Activity
              <Badge variant='outline' className='text-green-500 border-green-500/30 bg-green-500/10 text-[11px] gap-1'>
                <span className='h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block' />
                Live
              </Badge>
            </CardTitle>
            <CardDescription>Every message the bot sends and receives — refreshes every 15s</CardDescription>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <ScrollArea className='h-[420px]'>
            {isLoading ? (
              <div className='flex items-center justify-center h-32 text-sm text-muted-foreground'>Loading…</div>
            ) : events.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-48 gap-2 text-center px-6'>
                <Icons.activity className='h-8 w-8 text-muted-foreground/30' />
                <p className='text-sm text-muted-foreground'>No activity yet</p>
                <p className='text-xs text-muted-foreground/60'>Messages will appear here once the bot starts receiving DMs</p>
              </div>
            ) : (
              <div className='divide-y divide-border/40'>
                {events.map((event) => (
                  <div key={event.id} className='flex items-start gap-3 px-6 py-3 hover:bg-muted/30 transition-colors'>
                    <span className={`mt-2 h-2 w-2 rounded-full flex-shrink-0 ${dotColor[event.type]}`} />
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold flex-shrink-0'>
                      {event.initials}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium leading-tight'>{event.description}</p>
                      <p className='text-muted-foreground text-xs mt-0.5 truncate'>{event.preview}</p>
                    </div>
                    <span className='text-muted-foreground text-xs flex-shrink-0 pt-0.5'>
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message Volume — Last 4 Weeks</CardTitle>
          <CardDescription>Daily message activity heatmap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex gap-1.5'>
              {DAY_LABELS.map((d) => (
                <div key={d} className='flex-1 text-center text-[10px] text-muted-foreground font-medium'>{d}</div>
              ))}
            </div>
            {Array.from({ length: 4 }, (_, week) => (
              <div key={week} className='flex gap-1.5'>
                {Array.from({ length: 7 }, (_, day) => {
                  const val = heatmapData[week * 7 + day] ?? 0;
                  return <div key={day} className={`h-8 flex-1 rounded-md ${getHeatColor(val)}`} title={`${val} messages`} />;
                })}
              </div>
            ))}
            <div className='flex items-center gap-2 pt-2'>
              <span className='text-[10px] text-muted-foreground'>Less</span>
              {['bg-muted/40', 'bg-orange-500/20', 'bg-orange-500/40', 'bg-orange-500/60', 'bg-orange-500/80', 'bg-orange-500'].map((c) => (
                <div key={c} className={`h-3 w-5 rounded-sm ${c}`} />
              ))}
              <span className='text-[10px] text-muted-foreground'>More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
