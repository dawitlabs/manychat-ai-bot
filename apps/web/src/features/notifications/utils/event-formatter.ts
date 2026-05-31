import type { ApiEvent } from '@/lib/api-client';
import type { NotificationAction, NotificationStatus } from '@/components/ui/notification-card';

export const LAST_SEEN_KEY = 'notifications_last_seen';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

const VIEW_ACTION: NotificationAction = {
  id: 'view-conversation',
  label: 'View conversation',
  type: 'redirect',
  style: 'primary',
};

function formatName(firstName: string | null): string {
  return firstName ?? 'A lead';
}

function formatTitle(event: ApiEvent): string {
  const name = formatName(event.first_name);
  switch (event.type) {
    case 'booked':
      return `${name} booked a call`;
    case 'paused':
      return `${name}'s conversation paused`;
    case 'resumed':
      return `${name}'s conversation resumed`;
    case 'status_changed': {
      const to = (event.payload?.to as string | undefined) ?? '';
      return `${name} moved to ${to || 'new status'}`;
    }
    default:
      return `Activity from ${name}`;
  }
}

function formatBody(event: ApiEvent): string {
  switch (event.type) {
    case 'booked':
      return 'They scheduled a 20-min call. Check the conversation for details.';
    case 'paused':
      return 'The bot is paused. Reply manually when ready.';
    case 'resumed':
      return 'The bot is active again on this conversation.';
    case 'status_changed': {
      const from = (event.payload?.from as string | undefined) ?? '';
      const to = (event.payload?.to as string | undefined) ?? '';
      return from && to ? `Status changed from ${from} to ${to}.` : 'Conversation status updated.';
    }
    default:
      return '';
  }
}

export function eventToNotification(event: ApiEvent, lastSeenMs: number): Notification {
  const createdMs = new Date(event.created_at).getTime();
  const status: NotificationStatus = createdMs > lastSeenMs ? 'unread' : 'read';

  return {
    id: String(event.id),
    title: formatTitle(event),
    body: formatBody(event),
    status,
    createdAt: event.created_at,
    actions: [VIEW_ACTION],
  };
}
