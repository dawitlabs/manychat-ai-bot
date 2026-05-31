'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useLeads, useTemplates, type ApiTemplate } from '@/lib/api-client';

function countOccurrences(keywords: string[], leads: ReturnType<typeof useLeads>['leads']): number {
  if (!keywords || keywords.length === 0) {
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

function ObjectionCard({ objection, count }: { objection: ApiTemplate; count: number }) {
  return (
    <Card className='bg-gradient-to-br from-card to-muted/20'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex-1 min-w-0'>
            <CardTitle className='text-sm leading-snug'>
              {objection.trigger ? (
                <>
                  <span className='text-muted-foreground font-normal'>Trigger: </span>
                  {objection.trigger}
                </>
              ) : (
                objection.title
              )}
            </CardTitle>
            <Badge
              variant='outline'
              className={`mt-2 text-[10px] px-1.5 py-0 ${count > 0 ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground'}`}
            >
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
          <p className='text-sm text-foreground leading-relaxed'>{objection.body}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ObjectionsView() {
  const { leads } = useLeads();
  const { data: templates } = useTemplates();
  const objections = templates?.objections ?? [];

  const counts = React.useMemo(
    () => Object.fromEntries(objections.map((o) => [o.id, countOccurrences(o.keywords ?? [], leads)])),
    [objections, leads],
  );

  const totalSeen = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className='space-y-4'>
      <div className='flex items-start justify-between'>
        <div>
          <p className='text-muted-foreground text-sm'>How Kyle&apos;s AI handles every pushback</p>
          <p className='text-muted-foreground/60 text-xs mt-0.5'>
            Edit responses in{' '}
            <a href='/dashboard/templates' className='underline underline-offset-2 hover:text-foreground'>
              Templates → Objections
            </a>
            .
          </p>
        </div>
        <Badge variant='outline' className='bg-primary/10 text-primary border-primary/20'>
          <Icons.sparkles className='mr-1 h-3 w-3' />
          {totalSeen > 0 ? `${totalSeen} objections handled` : `${objections.length} handlers active`}
        </Badge>
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        {objections.map((obj) => (
          <ObjectionCard key={obj.id} objection={obj} count={counts[obj.id] ?? 0} />
        ))}
      </div>
    </div>
  );
}
