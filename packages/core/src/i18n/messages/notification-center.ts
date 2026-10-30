import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `notification-center` writes on its own. */
export interface NotificationCenterMessages {
  readonly all: Message;
  readonly caughtUp: Message;
  readonly dismiss: Message;
  readonly empty: Message;
  readonly fresh: Message<{ count: number }>;
  readonly loading: Message;
  readonly loadMore: Message;
  readonly markAll: Message;
  readonly markRead: Message;
  readonly markUnread: Message;
  readonly title: Message;
  readonly unread: Message<{ count: number }>;
  readonly unreadView: Message;
  readonly views: Message;
}

export const en: NotificationCenterMessages = {
  all: 'All',
  caughtUp: 'All caught up',
  dismiss: 'Dismiss',
  empty: 'No notifications',
  fresh: '{count, plural, one {# new notification} other {# new notifications}}',
  loading: 'Loading notifications',
  loadMore: 'Load more',
  markAll: 'Mark all as read',
  markRead: 'Mark as read',
  markUnread: 'Mark as unread',
  title: 'Notifications',
  unread: '{count} unread',
  unreadView: 'Unread',
  views: 'Views',
};

export const notificationCenterMessages: MessageFamily<
  'notificationCenter',
  NotificationCenterMessages
> = { name: 'notificationCenter', base: en };
