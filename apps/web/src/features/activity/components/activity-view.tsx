'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';

type EventType = 'sent' | 'received' | 'funnel' | 'stalled';

interface ActivityEvent {
  id: number;
  type: EventType;
  name: string;
  initials: string;
  description: string;
  preview: string;
  minutesAgo: number;
}

const dotColor: Record<EventType, string> = {
  sent: 'bg-green-500',
  received: 'bg-blue-500',
  funnel: 'bg-orange-500',
  stalled: 'bg-red-500'
};

const events: ActivityEvent[] = [
  { id: 1, type: 'sent', name: 'Marcus W.', initials: 'MW', description: 'AI replied to Marcus W. · Step 3 — Biggest Struggle', preview: 'Man, life events like that can really knock you off track. How much are you looking to lose?', minutesAgo: 2 },
  { id: 2, type: 'received', name: 'Tyler R.', initials: 'TR', description: 'Tyler R. replied · Qualifying', preview: 'Fat loss mainly. I used to be in shape but gained weight after my divorce', minutesAgo: 4 },
  { id: 3, type: 'funnel', name: 'Jordan M.', initials: 'JM', description: 'Jordan M. moved to Step 5 — Build the Bridge', preview: 'Kyle specifically works with guys in your exact situation...', minutesAgo: 7 },
  { id: 4, type: 'sent', name: 'Alex K.', initials: 'AK', description: 'AI replied to Alex K. · Step 4 — Real Obstacle', preview: 'Stress eating is a pattern Kyle specifically addresses — it\'s not about willpower', minutesAgo: 11 },
  { id: 5, type: 'received', name: 'Carlos P.', initials: 'CP', description: 'Carlos P. replied · Qualifying', preview: 'I tried diets before they never work long term. And I travel for work', minutesAgo: 14 },
  { id: 6, type: 'funnel', name: 'Brandon L.', initials: 'BL', description: 'Brandon L. advanced from Step 1 → Step 2', preview: 'Want to lose 35 lbs. Been trying for about a year now', minutesAgo: 18 },
  { id: 7, type: 'sent', name: 'Nate S.', initials: 'NS', description: 'AI sent opener to Nate S. · Step 1', preview: 'Hey Nate! You just unlocked Kyle\'s free fitness guide. What\'s the #1 thing...', minutesAgo: 22 },
  { id: 8, type: 'received', name: 'James T.', initials: 'JT', description: 'James T. replied · New Lead', preview: 'Hey saw the ad', minutesAgo: 27 },
  { id: 9, type: 'stalled', name: 'Devon C.', initials: 'DC', description: 'Devon C. stalled — no reply for 48h', preview: 'Last message: Lose weight. Sent follow-up ping.', minutesAgo: 32 },
  { id: 10, type: 'funnel', name: 'Sean B.', initials: 'SB', description: 'Sean B. moved to Step 6 — Book the Call', preview: 'Here\'s Kyle\'s calendar: https://calendly.com/kyle-briere-largedumbbells/30', minutesAgo: 38 },
  { id: 11, type: 'sent', name: 'Derek V.', initials: 'DV', description: 'AI replied to Derek V. · Step 2 — Nutrition Check', preview: 'How does your current diet look — are you cooking at home or eating out?', minutesAgo: 43 },
  { id: 12, type: 'received', name: 'Victor H.', initials: 'VH', description: 'Victor H. replied · Qualifying', preview: 'Mix of both honestly. I\'m not great in the kitchen', minutesAgo: 47 },
  { id: 13, type: 'funnel', name: 'Jason M.', initials: 'JM', description: 'Jason M. advanced from Step 2 → Step 3', preview: 'COVID hit me hard too man. Been 2 years since I was consistent', minutesAgo: 52 },
  { id: 14, type: 'sent', name: 'Kevin D.', initials: 'KD', description: 'AI sent re-engagement to Kevin D.', preview: 'Hey man, just wanted to check in. Still interested in making a change?', minutesAgo: 58 },
  { id: 15, type: 'received', name: 'Patrick O.', initials: 'PO', description: 'Patrick O. replied · New Lead', preview: 'Yes I\'m still here, just been busy with work', minutesAgo: 63 },
  { id: 16, type: 'sent', name: 'Robert A.', initials: 'RA', description: 'AI replied to Robert A. · Step 5', preview: 'Kyle specifically works with guys in your exact situation — stressed out and stuck in bad habits', minutesAgo: 71 },
  { id: 17, type: 'funnel', name: 'Daniel F.', initials: 'DF', description: 'Daniel F. BOOKED a call!', preview: 'Booked for Thursday at 2pm. Confirmation sent to email.', minutesAgo: 79 },
  { id: 18, type: 'received', name: 'Steven W.', initials: 'SW', description: 'Steven W. replied · Step 3', preview: 'How long have I been struggling? Honestly like 3 years', minutesAgo: 85 },
  { id: 19, type: 'sent', name: 'Andrew B.', initials: 'AB', description: 'AI replied to Andrew B. · Step 1', preview: 'What\'s your main fitness goal right now — fat loss, muscle, or both?', minutesAgo: 91 },
  { id: 20, type: 'stalled', name: 'Joseph K.', initials: 'JK', description: 'Joseph K. stalled — no reply for 72h', preview: 'Auto re-engagement queued for next message cycle', minutesAgo: 97 },
  { id: 21, type: 'received', name: 'Thomas C.', initials: 'TC', description: 'Thomas C. replied · Step 4', preview: 'My biggest obstacle is definitely time. I work 70 hour weeks', minutesAgo: 103 },
  { id: 22, type: 'funnel', name: 'Charles M.', initials: 'CM', description: 'Charles M. advanced from Step 4 → Step 5', preview: 'Kyle specifically works with busy professionals — here\'s what he\'d do...', minutesAgo: 108 },
  { id: 23, type: 'sent', name: 'William G.', initials: 'WG', description: 'AI replied to William G. · Step 3', preview: '2 years is a long time to be stuck. Kyle works specifically with busy professionals...', minutesAgo: 114 },
  { id: 24, type: 'received', name: 'David N.', initials: 'DN', description: 'David N. replied · New Lead', preview: 'I need accountability. I keep starting and stopping every month', minutesAgo: 119 },
  { id: 25, type: 'sent', name: 'Richard P.', initials: 'RP', description: 'AI sent opener to Richard P. · Step 1', preview: 'Hey Richard! What fitness goal are you working toward right now?', minutesAgo: 125 },
  { id: 26, type: 'funnel', name: 'Matthew S.', initials: 'MS', description: 'Matthew S. moved to Step 6 — Book the Call', preview: 'He\'s helped 40+ guys in your exact situation. Want to hop on a call?', minutesAgo: 131 },
  { id: 27, type: 'stalled', name: 'Anthony R.', initials: 'AR', description: 'Anthony R. went cold — no reply for 96h', preview: 'Sent final re-engagement attempt. Will archive if no reply.', minutesAgo: 138 },
  { id: 28, type: 'received', name: 'Mark L.', initials: 'ML', description: 'Mark L. replied · Qualifying', preview: 'Yeah I\'ve been dealing with this since COVID. The stress eating is real', minutesAgo: 145 },
  { id: 29, type: 'sent', name: 'Donald H.', initials: 'DH', description: 'AI replied to Donald H. · Step 2', preview: 'That\'s a tough spot but totally fixable. Are you eating 3 meals a day?', minutesAgo: 152 },
  { id: 30, type: 'funnel', name: 'Paul C.', initials: 'PC', description: 'Paul C. BOOKED a call!', preview: 'Amazing! Kyle will see you. Check your email for the confirmation.', minutesAgo: 158 },
];

const heatmapData = Array.from({ length: 28 }, (_, i) => {
  const seed = (i * 17 + 3) % 100;
  return Math.floor(seed * 0.8);
});

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatTimeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

function getHeatColor(value: number): string {
  if (value === 0) return 'bg-muted/40';
  if (value < 20) return 'bg-orange-500/20';
  if (value < 40) return 'bg-orange-500/40';
  if (value < 60) return 'bg-orange-500/60';
  if (value < 80) return 'bg-orange-500/80';
  return 'bg-orange-500';
}

export function ActivityView() {
  const [refreshKey, setRefreshKey] = React.useState(0);

  return (
    <div className='space-y-6'>
      {/* Top Stats */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card className='border-l-2 border-l-green-500 bg-gradient-to-br from-card to-muted/30'>
          <CardHeader className='pb-2'>
            <CardDescription>Messages Sent Today</CardDescription>
            <div className='flex items-end justify-between'>
              <span className='text-3xl font-bold tabular-nums'>47</span>
              <Icons.send className='h-5 w-5 text-green-500 mb-1' />
            </div>
          </CardHeader>
        </Card>
        <Card className='border-l-2 border-l-blue-500 bg-gradient-to-br from-card to-muted/30'>
          <CardHeader className='pb-2'>
            <CardDescription>Avg Response Time</CardDescription>
            <div className='flex items-end justify-between'>
              <span className='text-3xl font-bold tabular-nums'>1.3s</span>
              <Icons.zap className='h-5 w-5 text-blue-500 mb-1' />
            </div>
          </CardHeader>
        </Card>
        <Card className='border-l-2 border-l-orange-500 bg-gradient-to-br from-card to-muted/30'>
          <CardHeader className='pb-2'>
            <CardDescription>Active Conversations</CardDescription>
            <div className='flex items-end justify-between'>
              <span className='text-3xl font-bold tabular-nums'>8</span>
              <Icons.messageCircle className='h-5 w-5 text-orange-500 mb-1' />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Live Feed */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <span className='relative flex h-2.5 w-2.5'>
                <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75' />
                <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500' />
              </span>
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time bot events from the last 2 hours</CardDescription>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setRefreshKey((k) => k + 1)}
            title='Refresh feed'
          >
            <Icons.refresh className='h-4 w-4' />
          </Button>
        </CardHeader>
        <CardContent className='p-0'>
          <ScrollArea className='h-[420px]'>
            <div className='divide-y divide-border/40'>
              {events.map((event) => (
                <div
                  key={`${event.id}-${refreshKey}`}
                  className='flex items-start gap-3 px-6 py-3 animate-in fade-in slide-in-from-bottom-2 duration-300 hover:bg-muted/30 transition-colors'
                >
                  <div className='flex flex-col items-center gap-1 pt-1'>
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor[event.type]}`} />
                  </div>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold flex-shrink-0'>
                    {event.initials}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium leading-tight'>{event.description}</p>
                    <p className='text-muted-foreground text-xs mt-0.5 truncate max-w-[400px]'>
                      {event.preview}
                    </p>
                  </div>
                  <span className='text-muted-foreground text-xs flex-shrink-0 pt-0.5'>
                    {formatTimeAgo(event.minutesAgo)}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Message Volume — Last 4 Weeks</CardTitle>
          <CardDescription>Daily message activity heatmap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex gap-1.5'>
              {days.map((d) => (
                <div key={d} className='flex-1 text-center text-[10px] text-muted-foreground font-medium'>
                  {d}
                </div>
              ))}
            </div>
            {Array.from({ length: 4 }, (_, week) => (
              <div key={week} className='flex gap-1.5'>
                {Array.from({ length: 7 }, (_, day) => {
                  const idx = week * 7 + day;
                  const val = heatmapData[idx] ?? 0;
                  return (
                    <div
                      key={day}
                      className={`h-8 flex-1 rounded-md transition-all ${getHeatColor(val)}`}
                      title={`${val} messages`}
                    />
                  );
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
