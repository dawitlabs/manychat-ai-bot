'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Lead } from '@/lib/mock-data';
import { format } from 'date-fns';
import { Icons } from '@/components/icons';

interface ChatThreadProps {
  lead: Lead | null;
}

const statusColors: Record<string, string> = {
  New: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  Qualifying: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  Booked: 'bg-green-500/10 text-green-500 border-green-500/20',
  Stalled: 'bg-muted text-muted-foreground border-border',
};

export function ChatThread({ lead }: ChatThreadProps) {
  if (!lead) {
    return (
      <div className='flex h-full flex-col items-center justify-center gap-3 text-center'>
        <div className='bg-muted flex h-12 w-12 items-center justify-center rounded-full'>
          <Icons.chat className='text-muted-foreground h-6 w-6' />
        </div>
        <div>
          <p className='font-medium'>Select a conversation</p>
          <p className='text-muted-foreground text-sm'>Click any row on the left to view the chat</p>
        </div>
      </div>
    );
  }

  const sortedMessages = [...lead.messages].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='border-b px-4 py-3'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback className='text-sm font-semibold'>
              {lead.first_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0'>
            <p className='font-semibold'>{lead.first_name}</p>
            <p className='text-muted-foreground font-mono text-xs truncate'>{lead.user_id}</p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className={`text-xs capitalize ${
              lead.platform === 'instagram'
                ? 'bg-pink-500/10 text-pink-500 border-pink-500/20'
                : 'bg-blue-600/10 text-blue-600 border-blue-600/20'
            }`}>
              {lead.platform}
            </Badge>
            <Badge variant='outline' className={`text-xs ${statusColors[lead.status]}`}>
              {lead.status}
            </Badge>
          </div>
        </div>
        <div className='mt-2 flex items-center gap-4 text-xs text-muted-foreground'>
          <span>{lead.messages.length} messages</span>
          <span>Step {lead.funnelStep} of 6</span>
          <span className='capitalize'>{lead.source.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className='flex-1 px-4 py-3'>
        <div className='flex flex-col gap-3'>
          {sortedMessages.map((msg, i) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={i}
                className={`flex gap-2 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}
              >
                {isAI && (
                  <Avatar className='h-7 w-7 flex-shrink-0 mt-1'>
                    <AvatarFallback className='bg-primary text-primary-foreground text-xs font-bold'>
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[75%] ${isAI ? '' : ''}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      isAI
                        ? 'bg-primary text-primary-foreground rounded-tl-sm'
                        : 'bg-muted text-foreground rounded-tr-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <p className='text-muted-foreground mt-1 px-1 text-xs'>
                    {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
