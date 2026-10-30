import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `stat-card` writes on its own. */
export interface StatCardMessages {
  readonly down: Message;
  readonly empty: Message;
  readonly flat: Message;
  readonly up: Message;
}

export const en: StatCardMessages = {
  down: 'down',
  empty: '—',
  flat: 'unchanged',
  up: 'up',
};

export const statCardMessages: MessageFamily<'statCard', StatCardMessages> = {
  name: 'statCard',
  base: en,
};
