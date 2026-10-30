import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `message-scroller` writes on its own. */
export interface MessageScrollerMessages {
  readonly busy: Message;
  readonly idle: Message;
  readonly jumpCount: Message<{ count: number }>;
  readonly jumpToEnd: Message;
  readonly jumpToEndCount: Message<{ count: number }>;
  readonly jumpToStart: Message;
  readonly label: Message;
  readonly loader: Message;
  readonly unread: Message;
}

export const en: MessageScrollerMessages = {
  busy: 'Responding',
  idle: 'Response complete',
  jumpCount: '{count} new',
  jumpToEnd: 'Go to the latest',
  jumpToEndCount: 'Go to the latest, {count} new',
  jumpToStart: 'Go to the first',
  label: 'Messages',
  loader: 'Loading earlier messages',
  unread: 'New messages',
};

export const messageScrollerMessages: MessageFamily<'messageScroller', MessageScrollerMessages> = {
  name: 'messageScroller',
  base: en,
};
