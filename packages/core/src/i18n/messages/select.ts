import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `select` writes on its own. */
export interface SelectMessages {
  readonly clear: Message;
  readonly count: Message<{ count: number }>;
  readonly empty: Message;
  readonly loading: Message;
  readonly remove: Message<{ label: string }>;
  readonly search: Message;
  readonly searchPlaceholder: Message;
  readonly summary: Message<{ count: number }>;
}

export const en: SelectMessages = {
  clear: 'Clear selection',
  count: '{count, plural, one {# result} other {# results}}',
  empty: 'No options',
  loading: 'Loading…',
  remove: 'Remove {label}',
  search: 'Search options',
  searchPlaceholder: 'Search…',
  summary: '{count} selected',
};

export const selectMessages: MessageFamily<'select', SelectMessages> = { name: 'select', base: en };
