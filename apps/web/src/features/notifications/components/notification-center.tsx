'use client';

import * as React from 'react';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NotificationCard } from '@/components/ui/notification-card';
import { useEvents } from '@/lib/api-client';
import { eventToNotification, LAST_SEEN_KEY } from '../utils/event-formatter';
import { useRouter } from 'next/navigation';

const MAX_VISIBLE = 5;

export function NotificationCenter() {
  const { data: events = [] } = useEvents();
  const router = useRouter();
  const [lastSeen, setLastSeen] = React.useState<number>(() => {
    if (typeof window === 'undefined') return Date.now();
    return Number(localStorage.getItem(LAST_SEEN_KEY) ?? '0');
  });

  const notifications = React.useMemo(
    () => events.slice(0, MAX_VISIBLE).map((e) => eventToNotification(e, lastSeen)),
    [events, lastSeen],
  );

  const unreadCount = notifications.filter((n) => n.status === 'unread').length;

  function handleOpenChange(open: boolean) {
    if (open) {
      const now = Date.now();
      setLastSeen(now);
      if (typeof window !== 'undefined') localStorage.setItem(LAST_SEEN_KEY, String(now));
    }
  }

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='icon' className='relative h-8 w-8'>
          <Icons.notification className='h-4 w-4' />
          {unreadCount > 0 && (
            <span className='bg-destructive text-destructive-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className='sr-only'>Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-[calc(100vw-2rem)] p-0 sm:w-[380px]' sideOffset={8}>
        <div className='flex items-center justify-between px-4 py-3'>
          <Link href='/dashboard/notifications' className='group flex items-center gap-1'>
            <h4 className='text-sm font-semibold group-hover:underline'>Notifications</h4>
            <Icons.chevronRight className='text-muted-foreground h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
          </Link>
          {unreadCount > 0 && (
            <span className='bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs'>
              {unreadCount} new
            </span>
          )}
        </div>
        <Separator />
        <ScrollArea className='h-[400px]'>
          {notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Icons.notification className='text-muted-foreground/40 mb-2 h-8 w-8' />
              <p className='text-muted-foreground text-sm'>No activity yet</p>
            </div>
          ) : (
            <div className='flex flex-col gap-1 p-2'>
              {notifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  id={n.id}
                  title={n.title}
                  body={n.body}
                  status={n.status}
                  createdAt={n.createdAt}
                  actions={n.actions}
                  onAction={() => {
                    router.push(`/dashboard/conversations?lead=${encodeURIComponent(n.user_id)}`);
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
