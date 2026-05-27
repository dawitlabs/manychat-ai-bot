'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeads } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { Icons } from '@/components/icons';
import { leadStatusBadgeClass } from '@/lib/status-colors';

export function RecentLeads() {
  const { leads, isLoading } = useLeads();
  const recent = [...leads].sort((a, b) => b.lastActivity - a.lastActivity).slice(0, 5);

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Recent Leads</CardTitle>
        <CardDescription>Latest conversations with incoming leads</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex flex-col gap-4'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex items-center gap-3 animate-pulse'>
                <div className='h-9 w-9 rounded-full bg-muted' />
                <div className='flex-1 space-y-1.5'>
                  <div className='h-3 w-24 rounded bg-muted' />
                  <div className='h-2.5 w-16 rounded bg-muted' />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-10 gap-2 text-center'>
            <Icons.chat className='h-8 w-8 text-muted-foreground/40' />
            <p className='text-sm text-muted-foreground'>No leads yet</p>
            <p className='text-xs text-muted-foreground/60'>Conversations will appear here once the bot is live</p>
          </div>
        ) : (
          <div className='space-y-5'>
            {recent.map((lead) => (
              <div key={lead.user_id} className='flex items-center gap-3'>
                <Avatar className='h-9 w-9'>
                  <AvatarFallback className='text-xs font-semibold'>
                    {lead.first_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-medium leading-none'>{lead.first_name}</p>
                  <p className='text-muted-foreground mt-0.5 text-xs capitalize'>
                    {lead.platform} · {lead.messages.length} messages
                  </p>
                </div>
                <div className='flex flex-col items-end gap-1'>
                  <Badge variant='outline' className={`text-xs ${leadStatusBadgeClass(lead.status)}`}>
                    {lead.status}
                  </Badge>
                  <span className='text-muted-foreground text-xs'>
                    {formatDistanceToNow(new Date(lead.lastActivity), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
