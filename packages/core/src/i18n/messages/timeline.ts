import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/**
 * Every word `timeline` writes on its own. `current`, `expand` and `collapse`
 * are read straight after the event's title or the group's label, so each
 * carries its own separator: a language writes its own punctuation.
 */
export interface TimelineMessages {
  readonly collapse: Message;
  readonly current: Message;
  readonly empty: Message;
  readonly expand: Message;
  readonly freshItems: Message<{ count: number }>;
  readonly loading: Message;
  readonly loadMore: Message;
}

export const en: TimelineMessages = {
  collapse: ', Hide events',
  current: ', current',
  empty: 'No events yet',
  expand: ', Show events',
  freshItems: '{count, plural, one {# new event} other {# new events}}',
  loading: 'Loading more events',
  loadMore: 'Load more',
};

export const timelineMessages: MessageFamily<'timeline', TimelineMessages> = {
  name: 'timeline',
  base: en,
};
