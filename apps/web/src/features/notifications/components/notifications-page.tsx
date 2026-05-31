'use client';

import * as React from 'react';
import { Icons } from '@/components/icons';
import PageContainer from '@/components/layout/page-container';
import { NotificationCard } from '@/components/ui/notification-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useEvents } from '@/lib/api-client';
import { eventToNotification, LAST_SEEN_KEY } from '../utils/event-formatter';
import type { Notification } from '../utils/event-formatter';

export default function NotificationsPage() {
  const { data: events = [], isLoading } = useEvents();
  const router = useRouter();

  const [lastSeen] = React.useState<number>(() => {
    if (typeof window === 'undefined') return Date.now();
    const stored = Number(localStorage.getItem(LAST_SEEN_KEY) ?? '0');
    // Mark all as seen when viewing the full page
    const now = Date.now();
    if (typeof window !== 'undefined') localStorage.setItem(LAST_SEEN_KEY, String(now));
    return stored;
  });

  const notifications = React.useMemo(
    () => events.map((e) => eventToNotification(e, lastSeen)),
    [events, lastSeen],
  );

  const unread = notifications.filter((n) => n.status === 'unread');
  const read = notifications.filter((n) => n.status === 'read');

  const renderList = (items: Notification[]) => {
    if (isLoading) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <Icons.spinner className='text-muted-foreground mb-3 h-6 w-6 animate-spin' />
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className='flex flex-col items-center justify-center py-16'>
          <Icons.notification className='text-muted-foreground/40 mb-3 h-10 w-10' />
          <p className='text-muted-foreground text-sm'>No notifications</p>
        </div>
      );
    }
    return (
      <div className='flex flex-col gap-2'>
        {items.map((n) => (
          <NotificationCard
            key={n.id}
            id={n.id}
            title={n.title}
            body={n.body}
            status={n.status}
            createdAt={n.createdAt}
            actions={n.actions}
            onAction={(_notifId, _actionId, _type) => {
              router.push('/dashboard/conversations');
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <PageContainer
      pageTitle='Notifications'
      pageDescription='Lead activity and conversation events.'
    >
      <Tabs defaultValue='all'>
        <TabsList>
          <TabsTrigger value='all'>All ({notifications.length})</TabsTrigger>
          <TabsTrigger value='unread'>Unread ({unread.length})</TabsTrigger>
          <TabsTrigger value='read'>Read ({read.length})</TabsTrigger>
        </TabsList>
        <TabsContent value='all' className='mt-4'>
          {renderList(notifications)}
        </TabsContent>
        <TabsContent value='unread' className='mt-4'>
          {renderList(unread)}
        </TabsContent>
        <TabsContent value='read' className='mt-4'>
          {renderList(read)}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
