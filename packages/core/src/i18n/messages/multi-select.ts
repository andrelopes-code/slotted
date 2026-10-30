import type { MessageFamily } from '../translator';
import type { Message } from '../types';

/** Every word `multi-select` writes on its own. */
export interface MultiSelectMessages {
  readonly chosen: Message<{ count: number }>;
  readonly clear: Message;
  readonly count: Message<{ count: number }>;
  readonly counter: Message<{ count: number; max: number }>;
  readonly create: Message<{ query: string }>;
  readonly empty: Message;
  readonly loading: Message;
  readonly remove: Message<{ label: string }>;
  readonly reorder: Message<{ label: string; position: number; count: number }>;
  readonly trigger: Message;
}

export const en: MultiSelectMessages = {
  chosen: '{count} chosen',
  clear: 'Clear',
  count: '{count, plural, one {# result} other {# results}}',
  counter: '{count} of {max}',
  create: 'Add “{query}”',
  empty: 'No matches',
  loading: 'Loading…',
  remove: 'Remove {label}',
  reorder: '{label}, position {position} of {count}',
  trigger: 'Show options',
};

export const multiSelectMessages: MessageFamily<'multiSelect', MultiSelectMessages> = {
  name: 'multiSelect',
  base: en,
};
