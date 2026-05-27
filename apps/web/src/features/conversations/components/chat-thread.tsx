'use client';

import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lead } from '@/lib/types';
import { format } from 'date-fns';
import { Icons } from '@/components/icons';
import { leadStatusBadgeClass } from '@/lib/status-colors';
import { togglePause, sendManualMessage } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ChatThreadProps {
  lead: Lead | null;
}

export function ChatThread({ lead }: ChatThreadProps) {
  const qc = useQueryClient();
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [draft, setDraft] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [pausing, setPausing] = React.useState(false);

  const sortedMessages = React.useMemo(
    () => (lead ? [...lead.messages].sort((a, b) => a.timestamp - b.timestamp) : []),
    [lead],
  );

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lead?.user_id, sortedMessages.length]);

  // Clear draft when switching conversations
  React.useEffect(() => {
    setDraft('');
  }, [lead?.user_id]);

  const handlePauseToggle = async () => {
    if (!lead) return;
    setPausing(true);
    try {
      await togglePause(lead.user_id, !lead.paused);
      await qc.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(lead.paused ? 'Bot resumed' : 'Bot paused for this conversation');
    } catch {
      toast.error('Failed to update pause state');
    } finally {
      setPausing(false);
    }
  };

  const handleSend = async () => {
    if (!lead || !draft.trim()) return;
    setSending(true);
    try {
      const result = await sendManualMessage(lead.user_id, draft.trim());
      await qc.invalidateQueries({ queryKey: ['conversations'] });
      setDraft('');
      if (result.delivered) {
        toast.success('Message sent via ManyChat');
      } else if (result.manychatConfigured) {
        toast.warning('Message recorded — ManyChat delivery failed');
      } else {
        toast.info('Message recorded (MANYCHAT_API_KEY not configured — not delivered)');
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSend();
    }
  };

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

  if (lead.messages.length === 0) {
    return (
      <div className='flex h-full flex-col'>
        <ThreadHeader lead={lead} pausing={pausing} onPauseToggle={handlePauseToggle} />
        <div className='flex flex-1 flex-col items-center justify-center gap-3 text-center'>
          <div className='bg-muted flex h-12 w-12 items-center justify-center rounded-full'>
            <Icons.chat className='text-muted-foreground h-6 w-6' />
          </div>
          <div>
            <p className='font-medium'>No messages yet</p>
            <p className='text-muted-foreground text-sm'>This lead hasn't replied to the opening DM</p>
          </div>
        </div>
        <SendBox draft={draft} onDraftChange={setDraft} onSend={handleSend} onKeyDown={handleKeyDown} sending={sending} paused={lead.paused} />
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col'>
      <ThreadHeader lead={lead} pausing={pausing} onPauseToggle={handlePauseToggle} />

      <ScrollArea className='flex-1 min-h-0 overflow-hidden px-4 py-3'>
        <div className='flex flex-col gap-3 pb-2'>
          {sortedMessages.map((msg, i) => {
            const isAI = msg.role === 'assistant';
            return (
              <div key={i} className={`flex gap-2 ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
                {isAI && (
                  <Avatar className='h-7 w-7 flex-shrink-0 mt-1'>
                    <AvatarFallback className='bg-primary text-primary-foreground text-xs font-bold'>
                      AI
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className='max-w-[75%]'>
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
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <SendBox draft={draft} onDraftChange={setDraft} onSend={handleSend} onKeyDown={handleKeyDown} sending={sending} paused={lead.paused} />
    </div>
  );
}

function ThreadHeader({ lead, pausing, onPauseToggle }: { lead: Lead; pausing: boolean; onPauseToggle: () => void }) {
  return (
    <div className='border-b px-4 py-3 flex-shrink-0'>
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
          <Badge variant='outline' className={`text-xs ${leadStatusBadgeClass(lead.status)}`}>
            {lead.status}
          </Badge>
          <Button
            variant={lead.paused ? 'default' : 'outline'}
            size='sm'
            className='h-7 text-xs gap-1.5'
            onClick={onPauseToggle}
            disabled={pausing}
          >
            {lead.paused ? (
              <><Icons.play className='h-3 w-3' /> Resume</>
            ) : (
              <><Icons.pause className='h-3 w-3' /> Pause</>
            )}
          </Button>
        </div>
      </div>
      <div className='mt-2 flex items-center gap-4 text-xs text-muted-foreground'>
        <span>{lead.messages.length} messages</span>
        <span>Step {lead.funnelStep} of 6</span>
        <span className='capitalize'>{lead.source.replace('_', ' ')}</span>
        {lead.paused && (
          <span className='text-yellow-500 font-medium flex items-center gap-1'>
            <Icons.pause className='h-3 w-3' /> Bot paused
          </span>
        )}
      </div>
    </div>
  );
}

function SendBox({
  draft,
  onDraftChange,
  onSend,
  onKeyDown,
  sending,
  paused,
}: {
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  sending: boolean;
  paused: boolean;
}) {
  return (
    <div className='border-t p-3 flex-shrink-0'>
      {paused && (
        <p className='text-xs text-yellow-500 mb-2 flex items-center gap-1'>
          <Icons.pause className='h-3 w-3' />
          Bot is paused — your message will be sent but AI won't auto-reply
        </p>
      )}
      <div className='flex gap-2 items-end'>
        <Textarea
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder='Type a manual message… (⌘↵ to send)'
          className='min-h-[60px] max-h-[120px] resize-none text-sm'
          disabled={sending}
        />
        <Button
          onClick={onSend}
          disabled={sending || !draft.trim()}
          size='sm'
          className='h-9 px-3 flex-shrink-0'
        >
          {sending ? (
            <Icons.spinner className='h-4 w-4 animate-spin' />
          ) : (
            <Icons.send className='h-4 w-4' />
          )}
        </Button>
      </div>
    </div>
  );
}
