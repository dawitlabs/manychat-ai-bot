'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
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
    // For "no-reply": count stalled leads
    return leads.filter((l) => l.status === 'Lost').length;
  }
  let count = 0;
  for (const lead of leads) {
    for (const msg of lead.messages) {
      if (msg.role === 'user') {
        const lower = msg.content.toLowerCase();
        if (keywords.some((kw) => lower.includes(kw))) {
          count++;
          break; // count per lead, not per message
        }
      }
    }
  }
  return count;
}

function ObjectionCard({ objection, count }: { objection: Objection; count: number }) {
  const [response, setResponse] = React.useState(objection.response);
  const [saved, setSaved] = React.useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Objection handler saved', { description: 'Changes will apply to new conversations' });
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Card className='bg-gradient-to-br from-card to-muted/20'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-sm leading-snug'>
              <span className='text-muted-foreground font-normal'>Trigger: </span>
              {objection.trigger}
            </CardTitle>
            <Badge variant='outline' className={`mt-2 text-[10px] px-1.5 py-0 ${count > 0 ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'text-muted-foreground'}`}>
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
      <CardContent className='space-y-3'>
        <div>
          <p className='text-xs font-medium text-muted-foreground mb-1.5'>AI Response</p>
          <Textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3} className='text-sm resize-none' />
        </div>
        <Button size='sm' className='w-full' onClick={handleSave} variant={saved ? 'outline' : 'default'}>
          {saved ? <><Icons.check className='mr-2 h-3.5 w-3.5 text-green-500' />Saved!</> : <><Icons.check className='mr-2 h-3.5 w-3.5' />Save Handler</>}
        </Button>
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
        <p className='text-muted-foreground text-sm'>How Kyle&apos;s AI handles every pushback</p>
        <Badge variant='outline' className='bg-green-500/10 text-green-400 border-green-500/20'>
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
