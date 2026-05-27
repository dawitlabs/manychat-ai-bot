'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useLeads } from '@/lib/api-client';

interface Objection {
  id: string;
  trigger: string;
  keywords: string[];
  response: string;
  tags: string[];
}

const OBJECTIONS: Objection[] = [
  {
    id: 'price',
    trigger: '"how much is it?" / "what\'s the cost?"',
    keywords: ['how much', 'cost', 'price', 'expensive', 'investment', 'pay'],
    response: "We can go over the investment for sure man. But first I gotta know if you're just looking around or genuinely ready to make a change.",
    tags: ['price', 'deflect', 'qualify']
  },
  {
    id: 'offer',
    trigger: '"what exactly do you do?" / "what is this?"',
    keywords: ['what do you do', 'what is this', 'what exactly', 'tell me more', 'what do you offer'],
    response: "I provide a complete transformation system with custom nutrition and done-for-you workouts. Kyle works 1-on-1 with you to figure out exactly what your body needs.",
    tags: ['value', 'offer', 'clarity']
  },
  {
    id: 'free-call',
    trigger: '"is this free?" / "will you charge me?"',
    keywords: ['is this free', 'free', 'charge me', 'cost anything', 'no charge'],
    response: "Yeah for sure man, the conversation won't cost you a dime. It's just a quick 30-min chat to see if Kyle can actually help you.",
    tags: ['free', 'reassurance', 'call']
  },
  {
    id: 'no-reply',
    trigger: 'No reply for 48h',
    keywords: [],
    response: "Hey man, just wanted to bump this. Still interested in making a change? No pressure either way.",
    tags: ['re-engage', 'follow-up', '48h']
  },
  {
    id: 'tried-before',
    trigger: '"I\'ve tried things before" / "nothing has worked"',
    keywords: ['tried before', 'nothing works', 'doesn\'t work', 'failed', 'tried everything', 'been there'],
    response: "I hear that man — most programs fail because they're not built for your specific situation. What Kyle does is different because it starts with where YOU are at, not a cookie-cutter plan.",
    tags: ['skepticism', 'social-proof', 'empathy']
  },
  {
    id: 'too-busy',
    trigger: '"I\'m too busy" / "I don\'t have time"',
    keywords: ['too busy', 'no time', 'don\'t have time', 'not enough time', 'work too much', 'schedule'],
    response: "Totally get it — Kyle actually built his whole approach around busy guys. Most of his clients work 50-70 hour weeks. The program fits your schedule, not the other way around.",
    tags: ['time', 'busy', 'reframe']
  }
];

function countOccurrences(keywords: string[], leads: ReturnType<typeof useLeads>['leads']): number {
  if (keywords.length === 0) {
    return leads.filter((l) => l.status === 'Archived').length;
  }
  let count = 0;
  for (const lead of leads) {
    for (const msg of lead.messages) {
      if (msg.role === 'user') {
        const lower = msg.content.toLowerCase();
        if (keywords.some((kw) => lower.includes(kw))) {
          count++;
          break;
        }
      }
    }
  }
  return count;
}

function ObjectionCard({ objection, count }: { objection: Objection; count: number }) {
  return (
    <Card className='bg-gradient-to-br from-card to-muted/20'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-sm leading-snug'>
              <span className='text-muted-foreground font-normal'>Trigger: </span>
              {objection.trigger}
            </CardTitle>
            <Badge variant='outline' className={`mt-2 text-[10px] px-1.5 py-0 ${count > 0 ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground'}`}>
              {count > 0 ? `Seen ${count}× in conversations` : 'Not seen yet'}
            </Badge>
          </div>
        </div>
        <div className='flex flex-wrap gap-1 mt-2'>
          {objection.tags.map((tag) => (
            <span key={tag} className='inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'>
              {tag}
            </span>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div>
          <p className='text-xs font-medium text-muted-foreground mb-1.5'>AI Response</p>
          <p className='text-sm text-foreground leading-relaxed'>{objection.response}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ObjectionsView() {
  const { leads } = useLeads();

  const counts = React.useMemo(
    () => Object.fromEntries(OBJECTIONS.map((o) => [o.id, countOccurrences(o.keywords, leads)])),
    [leads]
  );

  const totalSeen = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-muted-foreground text-sm'>How Kyle&apos;s AI handles every pushback</p>
          <p className='text-muted-foreground/60 text-xs mt-0.5'>
            To edit responses, update the System Prompt in{' '}
            <a href='/dashboard/ai-control' className='underline underline-offset-2 hover:text-foreground'>AI Control</a>.
          </p>
        </div>
        <Badge variant='outline' className='bg-primary/10 text-primary border-primary/20'>
          <Icons.sparkles className='mr-1 h-3 w-3' />
          {totalSeen > 0 ? `${totalSeen} objections handled` : '6 handlers active'}
        </Badge>
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        {OBJECTIONS.map((obj) => (
          <ObjectionCard key={obj.id} objection={obj} count={counts[obj.id] ?? 0} />
        ))}
      </div>
    </div>
  );
}
